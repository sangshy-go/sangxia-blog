---
title: "Redis应用2-Redis实现开发者头条页面点赞功能"
date: 2017-05-07
category: 后端开发
tags: [redis, 点赞]
---

开发者头条是一个资源丰富的程序猿学习网站。当网站发布新的内容的时候，内容优秀的总是会被点赞。今天就利用Redis实现这个小小的功能。

![这里写图片描述](https://img-blog.csdn.net/20170507100352758?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvbm9hbWFuX3dncw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

---

### **为什么使用Redis而不是MySQL实现?**

Redis 和 MySQL应用场景不同。

- 从效率来说:   
   Redis的数据存放在内存，所以速度快但是会受到内存空间限制。   
   MySQL存放在硬盘，在速度上肯定没有Redis快，但是存放的数据量要多的多。
- 从功能来说：   
   Redis是一个K-V数据库，同时还支持List/Hash/Set/Sorted Set等几个简单数据结构，所以只能以这些数据结构为基础实现功能。

Redis性能好，快，并发高，但不能处理逻辑，而且不支持事务，看具体的场合，主要做数据缓存，减少MySQL数据库的压力。最擅长的是结构化数据的cache，计数器场景，轻量级的消息队列,Top排行榜等互联网应用场景。在点赞过后要立即刷新显示在页面，所以推荐使用Redis。至于并发问题，在此暂不考虑(其实是技术比较渣。。。)

---

### **Redis几种数据结构的适用场景**

> - **List:** 双向列表，适用于最新列表，关注列表；
> - **Set:** 适用于无顺序的集合，点赞点踩，抽奖，已读，共同好友；
> - **SortedSet :** 具有排序加成功能，适用于排行榜，优先队列的实现；
> - **Hash**：对象属性，不定长属性数；
> - **KV :** 单一数值，适用于验证码，缓存等实现。

---

### **代码实现**

接下来看看如何去实现。

首先必须要安装好Redis并且启动Redis服务，了解Redis的5种数据结构类型的介绍和基本命令的操作，了解Redis的Java客户端Jedis的操作。这些内容在此不一一详述，详情参见博文：<http://blog.csdn.net/noaman_wgs/article/details/59501400>。

了解了以上内容以后，接下来进入实战演练。   
 (注：本文只提供后台实现点赞的一种实现的思路与接口的实现，不提供前台页面的显示与操作)。

**实现思路**：   
 使用Redis的Set数据结构存储数据。   
 当前用户点赞的话，就将当前用户id存入到对应点赞集合当中，同时判断点反对集合中是否有此id值，有的话就移除；   
 当前用户点反对的话，与上面操作相反。   
 页面显示的时候就根据当前用户id在点赞集合和反对集合中查找，若id值在点赞集合中有对应值，就显示1，表示当前用户点赞；若在反对集合中有值，反对处就显示1.

**1. MAVEN中加入jar包;**

```
        <dependency>
            <groupId>redis.clients</groupId>
            <artifactId>jedis</artifactId>
            <version>2.8.0</version>
        </dependency>
```

**2. Jedis底层操作**   
 实现一个具有Dao功能的类，类中可以在Jedis连接池中获取一个Jedis连接，同时实现与Redis数据库的get, set , remove等操作。本文的实现用到的都是Redis中的Set数据结构。

```
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Service;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

/**
 * Created by Administrator on 2017/5/1.
 */
@Service
public class JedisAdapter implements InitializingBean {

    private static final Logger logger = LoggerFactory.getLogger(JedisAdapter.class);

    private Jedis jedis = null;
    private JedisPool jedisPool = null;

    @Override
    public void afterPropertiesSet() throws Exception {
        //初始化
        jedisPool = new JedisPool("localhost", 6379);
    }

    //获取一个Jedis
    private Jedis getJedis(){
        try{
            jedis =  jedisPool.getResource();
        }catch (Exception e){
            logger.error("获取jedis失败！" + e.getMessage());
        }finally {
            if(jedis != null){
                jedis.close();
            }
        }
        return jedis;
    }

    /**
     * 获取Redis中集合中某个key值
     * @param key
     * @return
     */
    public String get(String key){
        Jedis jedis = null;
        try {
            jedis =  jedisPool.getResource();
            return jedis.get(key);
        }catch (Exception e){
            logger.error("Jedis get发生异常 " + e.getMessage());
            return null;
        }finally {
            if(jedis != null){
                jedis.close();
            }
        }
    }

    /**
     * 给Redis中Set集合中某个key值设值
     * @param key
     * @param value
     */
    public void set(String key, String value){
        Jedis jedis = null;
        try {
            jedis = jedisPool.getResource();
            jedis.set(key, value);
        }catch (Exception e){
            logger.error("Jedis set 异常" + e.getMessage());
        }finally {
            if(jedis != null){
                jedis.close();
            }
        }
    }

    /**
     * 向Redis中Set集合添加值:点赞
     * @return
     */
    public long sadd(String key, String value){
        Jedis jedis = null;
        try{
            jedis =  jedisPool.getResource();
            return jedis.sadd(key, value);
        }catch (Exception e){
            logger.error("Jedis sadd 异常 ：" + e.getMessage());
            return 0;
        }finally {
            if (jedis != null){
                jedis.close();
            }
        }
    }

    /**
     * 移除：取消点赞
     * @param key
     * @param value
     * @return
     */
    public long srem(String key, String value){
        Jedis jedis = null;
        try{
            jedis =  jedisPool.getResource();
            return jedis.srem(key, value);
        }catch (Exception e){
            logger.error("Jedis srem 异常：" + e.getMessage());
            return 0;
        }finally {
            if (jedis != null){
                jedis.close();
            }
        }
    }

    /**
     *判断key,value是否是集合中值
     * @param key
     * @param value
     * @return
     */
    public boolean sismember(String key, String value){
        Jedis jedis = null;
        try{
            jedis =  jedisPool.getResource();
            return jedis.sismember(key, value);
        }catch (Exception e){
            logger.error("Jedis sismember 异常：" + e.getMessage());
            return false;
        }finally {
            if (jedis != null){
                try{
                    jedis.close();
                }catch (Exception e){
                    logger.error("Jedis关闭异常" + e.getMessage());
                }
            }
        }
    }

    /**
     * 获取集合大小
     * @param key
     * @return
     */
    public long scard(String key){
        Jedis jedis = null;
        try{
            jedis =  jedisPool.getResource();
            return jedis.scard(key);
        }catch (Exception e){
            logger.error("Jedis scard 异常：" + e.getMessage());
            return 0;
        }finally {
            if (jedis != null){
                jedis.close();
            }
        }
    }

}
```

**3. 生成点赞与反对键值：**   
 点击点赞或者反对的时候，都会根据所在资讯的id生成一个对应的点赞(likeKey) 或者 反对(disLikeKey)的Set集合key值， 将对应点赞或点反对的用户id当中value值存入Set集合。

```
/**
 * Created by Administrator on 2017/5/1.
 */
public class RedisKeyUtil {

    private static String SPLIT = ":";
    private static String BIZ_LIKE = "LIKE";
    private static String BIZ_DISLIKE = "DISLIKE";

    /**
     * 产生key:如在newsId为2上的咨询点赞后会产生key: LIKE:ENTITY_NEWS:2
     * @param entityId
     * @param entityType
     * @return
     */
    public static String getLikeKey(int entityId, int entityType){
        return BIZ_LIKE + SPLIT + String.valueOf(entityType) + SPLIT + String.valueOf(entityId);
    }
    /**
     * 取消赞:如在newsId为2上的资讯取消点赞后会产生key: DISLIKE:ENTITY_NEWS:2
     * @param entityId
     * @param entityType
     * @return
     */
    public static String getDisLikeKey(int entityId, int entityType){
        return BIZ_DISLIKE + SPLIT + String.valueOf(entityType) + SPLIT + String.valueOf(entityId);
    }
}
```

**4. LikeService实现**   
 主要实现的逻辑就是：用户点赞，就将此用户id存入对应的点赞集合中，同时从点反对集合中移除；同理点反对就将此用户id存入对应的点反对集合中，同时从点赞集合中移除此用户id。   
 点赞业务操作代码：

```
package com.nowcoder.service;

import com.nowcoder.util.JedisAdapter;
import com.nowcoder.util.RedisKeyUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Created by Administrator on 2017/5/1.
 */
@Service
public class LikeService {

    @Autowired
    JedisAdapter jedisAdapter;

    /**
     * 判断是点赞还是点反对
     * @param userId
     * @param entityType
     * @param entityId
     * @return
     */
    public int getLikeStatus(int userId, int entityType, int entityId) {
        //根据当前用户的userid分别生成一个likeKey 和 disLikeKey,再分别判断这两个值是否在对应的Like集合中和disLikeKey集合中
        //比如如果在likeKey集合中，就返回一个1，否则返回-1
        String likeKey = RedisKeyUtil.getLikeKey(entityId, entityType);
        //判断值为userId 的用户是否在key为listKey 的集合中
        if(jedisAdapter.sismember(likeKey, String.valueOf(userId))){
            return 1;
        }
        String disLikeKey = RedisKeyUtil.getDisLikeKey(entityId, entityType);
        return jedisAdapter.sismember(disLikeKey, String.valueOf(userId)) ? -1: 0;
    }

    /**
     * 点赞：即当前用户点赞后，被点赞用户的like集合中就会加上一个该点赞的用户信息
     * @param userId
     * @param entityType
     * @param entityId
     * @return
     */
    public long like(int userId, int entityType, int entityId){
        //在当前news上点赞后获取key:   LIKE:ENTITY_NEWS:2
       String likeKey = RedisKeyUtil.getLikeKey(entityId, entityType);
       //在喜欢集合中添加当前操作用户的userId(即当前用户点赞后，被点赞用户的like集合中就会加上一个点赞的用户信息)
       jedisAdapter.sadd(likeKey, String.valueOf(userId));

       String disLikeKey = RedisKeyUtil.getDisLikeKey(entityId, entityType);
       jedisAdapter.srem(disLikeKey, String.valueOf(userId));

       //返回点赞数量
        return jedisAdapter.scard(likeKey);
    }

    /**
     * 反对 ：即当前用户点反对后，被点反对用户的like集合中就会加上一个该点反对的用户信息
     * @param userId
     * @param entityType
     * @param entityId
     * @return
     */
    public long disLike(int userId, int entityType, int entityId){

        //谁点击反对，谁就出现在key为dislikeKey的Set集合中
        String disLikeKey = RedisKeyUtil.getDisLikeKey(entityId, entityType);
        jedisAdapter.sadd(disLikeKey, String.valueOf(userId));

        //从赞中删除
        String likeKey = RedisKeyUtil.getLikeKey(entityId, entityType);
        jedisAdapter.srem(likeKey, String.valueOf(userId));

        return jedisAdapter.scard(likeKey);
    }
}
```

**5. 点赞接口的实现：**

```
package com.nowcoder.controller;

import com.nowcoder.model.EntityType;
import com.nowcoder.model.HostHolder;
import com.nowcoder.model.News;
import com.nowcoder.service.LikeService;
import com.nowcoder.service.NewsService;
import com.nowcoder.util.ToutiaoUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * Created by Administrator on 2017/5/1.
 */
@Controller
public class LikeController {

    @Autowired
    LikeService likeService;
    @Autowired
    NewsService newsService;
    @Autowired
    HostHolder hostHolder;

    @RequestMapping(path = {"/like"}, method = {RequestMethod.GET, RequestMethod.POST})
    @ResponseBody
    public String like(@RequestParam("newsId") int newsId){
        //在likeKey对应的集合中加入当前用户的id
        long likeCount = likeService.like(hostHolder.getUser().getId(), EntityType.ENTITY_NEWS, newsId);

        //资讯上更新点赞数
        newsService.updateLikeCount(newsId, (int)likeCount);
        return ToutiaoUtil.getJSONString(0, String.valueOf(likeCount));
    }

    @RequestMapping(path = {"/dislike"}, method = {RequestMethod.POST, RequestMethod.GET})
    @ResponseBody
    public String disLike(@RequestParam("newsId") int newsId){

        //在disLikeKey对应的集合中加入当前用户
        long likeCount = likeService.disLike(hostHolder.getUser().getId(), EntityType.ENTITY_NEWS, newsId);
        if(likeCount <= 0){
            likeCount = 0;
        }

        //资讯上更新喜欢数
        newsService.updateLikeCount(newsId, (int)likeCount);
        return ToutiaoUtil.getJSONString(0, String.valueOf(likeCount));
    }


}
```