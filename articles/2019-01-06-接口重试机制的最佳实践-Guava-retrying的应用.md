---
title: "接口重试机制的最佳实践 - Guava-retrying的应用"
date: 2019-01-06
category: 随笔杂谈
tags: [接口重试, guava-retry]
---

项目开发中，调用第三方接口会因为网络延迟、异常导致调用的服务出错，重试几次可能就会调用成功（例如上传图片），所以需要一种重试机制进行接口重试来保证接口的正常执行。重试机制除了用代码实现外，guava-retry可以灵活的实现这一功能，  
 github 地址： <https://github.com/rholder/guava-retrying/tree/master/src/main/java/com/github/rholder/retry>

本文首先介绍如何用java代码实现接口的重试机制，然后介绍下guava-retry的使用。

#### 一、Java自己实现接口重试机制

首先需要一个服务，比如图片上传服务：

```
 public boolean uploadPicture(String fileName, int count) {
        System.out.println("开始上传文件:" + fileName);
        // 模拟在第3次重试成功
        if (count == 3) {
            System.out.println("文件上传成功, 重试次数:" + count);
            return true;
        }
        // 模拟因网络等原因导致的图片上传服务超时
        return false;
    }
```

在接口中模拟因网络故障，每次上传操作都是失败的，这个时候调用图片上传接口时需要重试3次，代码实现如下：

```
public void uploadFile(String fileName, int retryTimes) {
        PictureService pictureService = new PictureService();
        boolean success = pictureService.uploadPicture(fileName);
        if (retryTimes > 0) {
            int count = 1;
            while (!success && count <= retryTimes) {
                System.out.println("第-" + count + "-次重试");
                success = pictureService.uploadPicture(fileName);
                count++;

            }
        }
        return;
    }
```

测试：

```
public static void main(String[] args) {
        new Test2().uploadFile("testFile", 3);
}
```

测试结果如下：  
 ![](./images/ae6cbd99122bc57a.png)

可以看到如果图片服务接口PictureService返回的结果为false，会进行重试，上述代码可以初步实现接口的重试。

#### 二、接口重试的优雅实现 - guava-retry代码实战

上述代码虽然可以初步实现接口的重试，但是这样的代码不够优雅的同时，不能做到更好的去控制接口的重试，比如进行重试的条件是否可控、重试的次数、重试的策略选择等等，而guava-retry就提供了这种简便、可供实现的接口重试机制。  
 下面首先看看guava-retry是如何实现接口重试的。

##### 1、pom.xml

首先引入jar包：

```
<dependency>
      <groupId>com.github.rholder</groupId>
      <artifactId>guava-retrying</artifactId>
      <version>2.0.0</version>
</dependency>
```

##### 2、代码实现

```
package com.hrms.csdn;

import com.github.rholder.retry.Retryer;
import com.github.rholder.retry.RetryerBuilder;
import com.github.rholder.retry.StopStrategies;
import com.github.rholder.retry.WaitStrategies;
import com.google.common.base.Predicates;

import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

/**
 * Created by wanggenshen
 * Date: on 2019/1/4 00:42.
 * Description: XXX
 */
public class Test {

    static Retryer<Boolean> retryer;

   static {
        retryer = RetryerBuilder.<Boolean>newBuilder()
                .retryIfException() // 抛出异常会进行重试
                .retryIfResult(Predicates.equalTo(false)) // 如果接口返回的结果不符合预期,也需要重试
                .withWaitStrategy(WaitStrategies.fixedWait(1, TimeUnit.SECONDS)) // 重试策略, 此处设置的是重试间隔时间
                .withStopStrategy(StopStrategies.stopAfterAttempt(5)) // 重试次数
                .build();
    }


    public boolean uploadFile(String fileName) {
        try {

            return retryer.call(new Callable<Boolean>() {
                int count = 0;
                @Override
                public Boolean call() throws Exception {
                    return new PictureService().uploadPicture(fileName, count++);
                }
            });
        } catch (Exception e) {
        	e.printStackTrace();
            return false;
        }

    }


    public static void main(String[] args) {
        new Test().uploadFile("testFile");
    }
}
```

##### 3、测试结果：

![](./images/dd143fa4dbfed25f.png)

#### 三、guava-retry使用介绍

通过代码实战我们了解到了guava-retry接口重试的实现，现在看看guava-retry的详细配置，以及如何更好的使用。

##### 1、RetryerBuilder

RetryerBuilder是用来快速生成Retryer实例，并且可以配置重试次数、超时时间等。

##### 2、retryIfException、retryIfRuntimeException、retryIfExceptionOfType

- retryIfException  
   retryIfException支持Exception异常对象，当抛出runtime异常、checked异常时都会重试，但是error不会重试。
- retryIfRuntimeException  
   retryIfRuntimeException只会在抛出Runtime异常的时候才会重试，checked异常和error都不重试。
- retryIfExceptionOfType  
   retryIfExceptionOfType允许我们只在发生特定异常的时候才重试，比如NullPointerException和IllegalStateException都属于runtime异常，也包括自定义的error

`.retryIfExceptionOfType(Error.class)// 只在抛出error重试`

出现指定异常时才会重试  
 `.retryIfExceptionOfType(IllegalStateException.class) .retryIfExceptionOfType(NullPointerException.class)`

##### 3、retryIfResult

retryIfResult可以指定你的Callable方法在返回值的时候进行重试，如　　  
 `.retryIfResult(Predicates.equalTo(false)) // 返回false重试`

##### 4、WaitStrategy

等待时长策略，重试间隔时间。  
 常用的策略有：

- FixedWaitStrategy 固定等待时长策略;  
   `.withWaitStrategy(WaitStrategies.fixedWait(1, TimeUnit.SECONDS)`
- RandomWaitStrategy 随机等待时长策略（可以提供一个最小和最大时长，等待时长为其区间随机值）。
- IncrementingWaitStrategy 递增等待时长策略（提供一个初始值和步长，等待时间随重试次数增加而增加）。

##### 5、StopStrategy

停止重试策略，提供三种:

- StopAfterDelayStrategy 设定一个最长允许的执行时间；比如设定最长执行10s，无论任务执行次数，只要重试的时候超出了最长时间，则任务终止，并返回重试异常RetryException；  
   `.withStopStrategy(StopStrategies.stopAfterDelay(5, TimeUnit.SECONDS)) // 最长允许执行的时间`
- StopAfterAttemptStrategy 设定最大重试次数，如果超出最大重试次数则停止重试，并返回重试异常；  
   `.withStopStrategy(StopStrategies.stopAfterAttempt(5)) // 重试次数`
- NeverStopStrategy 不停止，用于需要一直轮训知道返回期望结果的情况。

##### 6、RetryListener

自定义重试监听器，可以用于异步记录错误日志。当发生重试的时候，需要记录下重试的次数、结果等信息，或者有更多的拓展。

具体用法如下：

```
public class MyRetryListener implements RetryListener {


    @Override
    public <Boolean> void onRetry(Attempt<Boolean> attempt) {
        // 距离上一次重试的时间间隔
        System.out.println("距上一次重试的间隔时间为:" + attempt.getDelaySinceFirstAttempt());
        // 重试次数
        System.out.println("重试次数: " + attempt.getAttemptNumber());
        // 重试过程是否有异常
        System.out.println("重试过程是否有异常:" + attempt.hasException());
        if (attempt.hasException()) {
            System.out.println("异常的原因:" + attempt.getExceptionCause().toString());
        }
        //重试正常返回的结果
        System.out.println("重试结果为:" + attempt.hasResult());

        System.out.println();
    }
}
```

```
static Retryer<Boolean> retryer;

 static {
        retryer = RetryerBuilder.<Boolean>newBuilder()
                .retryIfException() // 抛出异常会进行重试
                .retryIfResult(Predicates.equalTo(false)) // 如果接口返回的结果不符合预期,也需要重试
                .withWaitStrategy(WaitStrategies.fixedWait(1, TimeUnit.SECONDS)) // 重试策略, 此处设置的是重试间隔时间
                .withStopStrategy(StopStrategies.stopAfterAttempt(5)) // 重试次数
                .withRetryListener(new MyRetryListener())
                .build();
    }
```

最后的执行结果如下：  
 ![](./images/4b8832bf9e315e9e.png)

---

参考：<https://blog.csdn.net/songhaifengshuaige/article/details/79440285>