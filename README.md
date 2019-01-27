# bot-util

**bot-util** is a NodeJS package that makes it easier to post and automate posting to Facebook pages.

  - Add Facebook pages by ID or link
  - Add an app token with **manage_pages** and **publish_pages** permissions.
  - Automate your posting!

### Installation


```sh
$ npm install --save bot-util
```
### Quick Start

```node
let bot_util = require('bot-util');

// using Promises
bot_util.facebook.AddPage(PAGE_ID/PAGE_URL, ACCESSTOKEN)
  .then(id => {
    bot_util.facebook.pages[id].Post({
      type: 'text',
      message: 'This is my first post!'
    }).then(res => {
      console.log(`Posted. Post ID: ${res.id}`);
    }).catch(err => {
      console.log(err);
    });
  })
  .catch(err => {
    throw err;
  })

// using await
async function setupPage(){
  let id = await bot_util.facebook.AddPage(PAGE_ID/PAGE_URL, ACCESSTOKEN);
  let post = await bot_util.facebook.pages[id].Post({
    type: 'text',
    message: 'This is my first post!'
  });
  console.log(`Posted. Post ID: ${post.id}`);
}

setupPage();
```

## Posting
A post has a type of either *text*, *image*, or *video*.

**Make sure you already added the page before using its ID**
#### Posting text
```node
bot_util.facebook.pages[id].Post({
  type: 'text',
  message: 'This is my first post!'
}).then(res => {
  console.log(`Posted. Post ID: ${res.id}`);
}).catch(err => { console.log(err); });
```

#### Posting an image

When posting an *image* or a *video*, the *'source'* property of the object can either be a **path** or a **ReadStream**.

The properties *message*, *caption* and *description* can be used interchangeably for posts.

```node
bot_util.facebook.pages[id].Post({
  type: 'image',
  source: 'path/to/image.png',
  caption: 'this is an image!' // optional
}).then(res => {
  console.log(`post id: ${res.id}`);
}).catch(err => { console.log(err) });
```

#### Posting video

```node
bot_util.facebook.pages[id].Post({
  type: 'video',
  source: 'path/to/video.mp4',
  title: 'Video Title', // optional
  description: 'this is a video!' // optional
}).then(res => {
  console.log(`post id: ${res.id}`);
}).catch(err => { console.log(err) });
```

## Commenting
A comment can also contain a *source* property that is used to comment pictures. The *'source'* property can be either a **path** or a **ReadStream**.

The *object_id* is the ID of the object upon which the comment will be made.
```node
bot_util.facebook.pages[id].Comment({
  on: object_id,
  message: 'This is a comment!',
  source: 'path/to/image.png' // optional
}).then(res => {
  console.log(`comment id: ${res.id}`);
}).catch(err => { console.log(err) });
```

## Getters

**bot-util** can also be used to get *posts*, *comments*, and *reactions*.

### Posts
#### all
```node
bot_util.facebook.pages[id].get.posts.all()
.then(res => {
  console.log(res);
}).catch(err => { console.log(err) });
```
#### latest
``latest()`` returns the latest post made on the specified page.
```node
bot_util.facebook.pages[id].get.posts.latest()
.then(res => {
  console.log(res);
}).catch(err => { console.log(err) });
```

### Comments
The *object_id* is the ID of the object that we are retrieving the comments of.
```node
bot_util.facebook.pages[id].get.comments(object_id).then(comments => {
  console.log(comments);
}).catch(err => { console.log(err) });
```

### Reactions
The *object_id* is the ID of the object that we are retrieving the reactions of.
```node
bot_util.facebook.pages[id].get.reactions(object_id).then(reactions => {
  console.log(reactions);
}).catch(err => { console.log(err) });
```

## Scheduling Posts
``bot_util.facebook.pages[page_id].SchedulePost(recurrenceRule, func)``

'func' gets called everytime [node-schedule](https://github.com/node-schedule/node-schedule) fires.

``onPosted(res)`` is a callback function that gets called everytime that post is made and is passed an object containing the `post id` and, if it's the case, `comment id`.

For more info on the ``0 */30 * * * *`` pattern you can check out the [node-schedule](https://github.com/node-schedule/node-schedule) package because they have a much better explanation than I could give! For now, ``0 */30 * * * *`` means every 30 minutes, ``0 0 * * * *`` means every hour, ``0 0 */2 * * *`` means every 2 hours.

#### Sync
```node
bot_util.facebook.pages[id].SchedulePost('0 */30 * * * *', () => {
    //do sync stuff here, then return the Post object
    return {
        type: 'text', //required [text, image, video]
        caption: 'Scheduled posts! woo!', // REQUIRED [caption/message/description]
        source: 'path/to/file', // REQUIRED IF TYPE IS image OR video [path, ReadStream]
        comment: { // optional
            message: 'this is a comment!', // required
            source: 'path/to/image/image.png' //OPTIONAL [path, ReadStream]
        }, // OPTIONAL
        onPosted: res => {
            console.log(`post id: ${res.id}, comment id: ${res.comment_id}`);
        }
    }
}).then(job => {
    //the node-schedule job gets returned
}).catch(err => {
    throw err;
})
```
#### Async
In the following snippet of code, ``doAsyncStuff()`` is a hypothetical asynchronous function that is resolved at some unknown time in the future.
```node
bot_util.facebook.pages[id].SchedulePost('0 */30 * * * *', () => {
    return new Promise((resolve, reject) => {
        //do async stuff here, then resolve the Post object
        doAsyncStuff().then(() => {
            resolve({
                type: 'text', //required [text, image, video]
                caption: 'Scheduled posts! woo!', // REQUIRED [caption/message/description]
                source: 'path/to/file', // REQUIRED IF TYPE IS image OR video [path, ReadStream]
                comment: { // optional
                    message: 'this is a comment!', // required
                    source: 'path/to/image/image.png' //OPTIONAL [path, ReadStream]
                }, // OPTIONAL
                onPosted: res => {
                    console.log(`post id: ${res.id}, comment id: ${res.comment_id}`);
                }
            })
        })
    })
}).then(job => {
    //the node-schedule job gets returned
}).catch(err => {
    throw err;
});

```

**If these wrappers don't satisfy your needs, you still have access to the whole FB api by using `bot_util.facebook.api`**

## TODO
 - Discord support
