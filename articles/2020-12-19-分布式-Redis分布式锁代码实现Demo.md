---
title: "【分布式】Redis分布式锁代码实现Demo"
date: 2020-12-19
category: 后端开发
tags: []
---

#### 分布式锁实现要素

分布式锁实现注意几个要素：

- 加锁过程原子性：加锁时首先判断key是否存在、是否有值，没有值再设置，这3个步骤需要是原子操作；
- 锁正常释放：出现超时、网络等问题时，保证加的锁可以正常释放；
- 锁正确释放：锁A释放时，需要保证只能由加A锁的客户端释放，否则可能就会出现误删锁；
- 锁高可用保证：分布式锁如Redis或ZK出现宕机时，如何保证加锁功能不被影响，需要根据业务考虑到CP、CA抉择选择合适的实现方式；同时可以添加兜底逻辑，如使用CA模型的ZK分布式锁时，当出现分布式不可用时，可以退化成本地锁或MySQL实现的分布式锁等。

#### Redis分布式锁代码示例

下面代码实现了Redis分布式锁加锁、解锁的过程：

```
public interface DistributedLock {
    Lock obtainLock(String key);
}

public class RedisDistributedLock implements DistributedLock {

    private static final Logger logger = LoggerFactory.getLogger(RedisDistributedLock.class);
    /**
     * Get redis lock script.
     * param1 - KEYS[1]: redisKey
     * params2 -  ARGV[1]: clientId
     * params3 - ARGV[2]: expire time
     *
     */
    private static final String OBTAIN_LOCK_SCRIPT =
            "local lockClientId = redis.call('GET', KEYS[1])\n" +
                    "if lockClientId == ARGV[1] then\n" +
                    "  redis.call('PEXPIRE', KEYS[1], ARGV[2])\n" +
                    "  return true\n" +
                    "elseif not lockClientId then\n" +
                    "  redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[2])\n" +
                    "  return true\n" +
                    "end\n" +
                    "return false";
    private final String clientId = UUID.randomUUID().toString();
    private final long expireTime;
    private final Map<String, RedisLocalLock> locks = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;
    private final RedisScript<Boolean> redisScript;
    private Executor executorService = Executors.newFixedThreadPool(2, new CustomerThreadFactory("Redis-Lock-Executor"));

    static class CustomerThreadFactory implements ThreadFactory {

        private String name;

        public CustomerThreadFactory(String name) {
            this.name = name;
        }

        @Override
        public Thread newThread(Runnable r) {
            return new Thread();
        }
    }

    /**
     * Prefix path of a redis key, usually use project name.
     * eg: in a order service(driver-order),
     *     order pay redis key like this: driver-order:order:pay:13932032323288
     *     order cancel redis key like this: driver-order:order:cancel:13289328392932
     */
    private final String registerPath;

    public RedisDistributedLock(RedisConnectionFactory connectionFactory, String registerPath) {
        this(connectionFactory, registerPath, 0);
    }

    public RedisDistributedLock(RedisConnectionFactory connectionFactory, String registerPath, long expireTime) {
        this.redisTemplate = new StringRedisTemplate(connectionFactory);
        this.registerPath = registerPath;
        this.redisScript = new DefaultRedisScript(OBTAIN_LOCK_SCRIPT, Boolean.class);
        this.expireTime = expireTime;
    }

    public void setExecutor(Executor executor) {
        this.executorService = executor;
    }

    @Override
    public Lock obtainLock(String key) {
        Assert.notNull(key != null, "key should not null.");
        return this.locks.computeIfAbsent(key, RedisLocalLock::new);
    }

    private final class RedisLocalLock implements Lock {
        private String lockKey;

        /**
         * Local lock, implement re-entry lock and deduct the pressure of redis.
         */
        private final ReentrantLock localLock = new ReentrantLock();

        /**
         * Record the time on acquire lock to calculate the lock is expire.
         */
        private volatile long lockAcquireTime;

        public RedisLocalLock(String lockKey) {
            this.lockKey = RedisDistributedLock.this.registerPath + ":" + lockKey;
        }

        /**
         * Assumed thread-A obtain lock, thread-B try acquire lock will wait
         * and cannot be interrupted, if use thread-B.interrupt() method, will wait until it acquired lock.
         */
        @Override
        public void lock() {
            // local lock
            localLock.lock();
            while (true) {
                try {
                    // redis lock
                    while (!obtainLock()) {
                        Thread.sleep(100);
                    }

                    // acquired lock then break while
                    break;
                } catch (InterruptedException e) {
                    //..
                } catch (Exception e) {
                    this.localLock.unlock();
                    throw new RuntimeException("Cannot acquire lock " + this.lockKey + ", cause="  +e.getMessage());
                }
            }
        }

        private boolean obtainLock() {
            boolean success = RedisDistributedLock.this.redisTemplate.execute(RedisDistributedLock.this.redisScript,
                    Collections.singletonList(this.lockKey),
                    RedisDistributedLock.this.clientId,
                    String.valueOf(RedisDistributedLock.this.expireTime));
            if (success) {
                lockAcquireTime = System.currentTimeMillis();
            }
            return success;
        }

        /**
         *  Assumed thread-A obtain lock,
         *  while thread-B try acquiring lock, if use threadB.interrupter, will occur  InterruptedException,
         *  then unlock will throws java.lang.IllegalMonitorStateException because the lock is not held by threadB.
         *
         * @throws InterruptedException
         */
        @Override
        public void lockInterruptibly() throws InterruptedException {
            this.localLock.lockInterruptibly();
            try {
                while (!obtainLock()) {
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                this.localLock.unlock();
                Thread.currentThread().interrupt();
                throw e;
            } catch (Exception e) {
                this.localLock.unlock();
                throw new RuntimeException("lock interruptibly exception: " + e.toString());
            }

        }

        /**
         * If lock is holding by thread-A, thread-B try acquire lock will return false, else return true.
         * @return
         */
        @Override
        public boolean tryLock() {
            try {
                return this.tryLock(0, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.interrupted();
                return false;
            }
        }

        /**
         * If lock is holding by thread-A,
         * thread-B will try acquire lock while whole unit time.
         *
         * @param time
         * @param unit
         * @return
         * @throws InterruptedException
         */
        @Override
        public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {
            boolean lockSuccess = this.localLock.tryLock(time, unit);
            if (!lockSuccess) {
                return false;
            }

            long now = System.currentTimeMillis();
            long expire = now + TimeUnit.SECONDS.convert(time, unit);
            try {
                boolean acquired;
                while (!(acquired = obtainLock()) && System.currentTimeMillis() < expire) {
                    Thread.sleep(100);
                }
                // if in time can't acquire lock, then unlock
                if (!acquired) {
                    localLock.unlock();
                }
                return acquired;

            } catch (Exception e) {
                this.localLock.unlock();
                throw new RuntimeException(e.toString());
            }

        }

        /**
         * lock unlock.
         *
         */
        @Override
        public void unlock() {
            if (!localLock.isHeldByCurrentThread()) {
                throw new IllegalStateException("Lock is not held by current thread");
            }

            // if lock hold count > 1, local lock -1.
            if (localLock.getHoldCount() > 1) {
                localLock.unlock();
                return;
            }

            try {
                if (Thread.currentThread().isInterrupted()) {
                    executorService.execute(() -> RedisDistributedLock.this.redisTemplate.delete(lockKey));
                } else {
                    RedisDistributedLock.this.redisTemplate.delete(lockKey);
                }
                logger.info("Success delete lockKey:{}", lockKey);

            } catch (Exception e) {
                throw new RuntimeException(e.toString());
            } finally {
                this.localLock.unlock();
            }

        }

        @Override
        public Condition newCondition() {
            throw new UnsupportedOperationException("Condition is not supported.");
        }
    }

}
```