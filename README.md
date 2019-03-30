# bot-util

**bot-util** is a package that makes it easier to post and automate posting to Facebook pages.

  - Add Facebook pages by ID or link
  - Add an app token with **manage_pages** and **publish_pages** permissions.
  - Automate your posting!

### Installation

```sh
$ npm install --save bot-util
```
### Quick Start

```js
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

If you have multiple pages that you want to add all at once, you can use ``AddPages(pages: array)``, the array containing objects that look like ``{ id: PAGEID, token: TOKEN }``

```js
bot_util.facebook.AddPages([
    { id: PAGEID1, token: TOKEN1 },
    { id: PAGEID2, accessToken: TOKEN2 },
    { id: PAGEID3, token: TOKEN3, name: 'Page name' }
]).then(ids => {
    console.log('pages added');
})
```

## Posting
A post has a type of either *text*, *image*, or *video*.

**Make sure you already added the page before using its ID**
#### Posting text
```js
bot_util.facebook.pages[id].Post({
  type: 'text',
  message: 'This is my first post!'
}).then(res => {
  console.log(`Posted. Post ID: ${res.id}`);
}).catch(err => console.log(err));
```

#### Posting an image

When posting an *image* or a *video*, the *'source'* property of the object can either be a **path** or a **ReadStream**.

The properties *message*, *caption* and *description* can be used interchangeably for posts.

```js
bot_util.facebook.pages[id].Post({
  type: 'image',
  source: 'path/to/image.png',
  caption: 'this is an image!' // optional
}).then(res => {
  console.log(`post id: ${res.id}`);
}).catch(err => console.log(err));
```

#### Posting video

```js
bot_util.facebook.pages[id].Post({
  type: 'video',
  source: 'path/to/video.mp4',
  title: 'Video Title', // optional
  description: 'this is a video!' // optional
}).then(res => {
  console.log(`post id: ${res.id}`);
}).catch(err => console.log(err));
```

## Commenting
A comment can also contain a *source* property that is used to comment pictures. The *'source'* property can be either a **path** or a **ReadStream**.

The *object_id* is the ID of the object upon which the comment will be made.
```js
bot_util.facebook.pages[id].Comment({
  on: object_id,
  message: 'This is a comment!',
  source: 'path/to/image.png' // optional
}).then(res => {
  console.log(`comment id: ${res.id}`);
}).catch(err => console.log(err));
```

## Getters

**bot-util** can also be used to get *posts*, *comments*, and *reactions*.

All getters accept an `options` object.
Currently the only parameter the `options` object supports is `fields` which specifies which fields should be retrieved from the Facebook API.

The `fields` parameter can either be a string (with the fields separated by ","), or an array of strings. For example:
```js
bot_util.facebook.pages[id].get.posts.all({fields: ['id', 'message', 'type']})
.then(res => {
  //every post in `res` will have their id, message and type [link, status, photo, video, offer]
}).catch(err => console.log(err));
```
or
```js
bot_util.facebook.pages[id].get.posts.all({fields: 'id, message, created_time'})
.then(res => {
  //every post in `res` will have their id, message and creation time
}).catch(err => console.log(err));
```

### Posts
#### all
``all(options: object)``
```js
bot_util.facebook.pages[id].get.posts.all()
.then(res => {
  console.log(res);
}).catch(err => console.log(err));
```
#### latest
``latest()`` (without any parameter) returns the latest post made on the specified page.
```js
bot_util.facebook.pages[id].get.posts.latest()
.then(res => {
  console.log(res);
}).catch(err => console.log(err));
```
``latest(n: number, options: object)`` returns the latest n posts made on the specified page.
```js
bot_util.facebook.pages[id].get.posts.latest(5)
.then(res => {
  //the last 5 posts
  console.log(res);
}).catch(err => console.log(err));
```

#### range
``range(start_date: Date, end_date: Date, options: object)`` returns all posts published between the two dates
```js
let now = new Date();
let aWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
bot_util.facebook.pages[id].get.posts.range(aWeekAgo, now)
.then(posts => {
  //all posts published in the last 7 days
  console.log(posts);
}).catch(err => console.log(err));
```
### Comments
``comments(object_id: string, options: object)``
The *object_id* is the ID of the object that we are retrieving the comments of.
```js
bot_util.facebook.pages[id].get.comments(object_id).then(comments => {
  console.log(comments);
}).catch(err => console.log(err));
```

### Reactions
``reactions(object_id: string, options: object)``
The *object_id* is the ID of the object that we are retrieving the reactions of.
```js
bot_util.facebook.pages[id].get.reactions(object_id).then(reactions => {
  console.log(reactions);
}).catch(err => console.log(err));
```

## Scheduling Posts
``bot_util.facebook.pages[page_id].SchedulePost(recurrenceRule, func)``

'func' gets called everytime [node-schedule](https://github.com/node-schedule/node-schedule) fires.

``onPosted(res)`` is a callback function that gets called everytime that post is made and is passed an object containing the `post id` and, if it's the case, `comment id`.

For more info on the ``0 */30 * * * *`` pattern you can check out the [node-schedule](https://github.com/node-schedule/node-schedule) package because they have a much better explanation than I could give! For now, ``0 */30 * * * *`` means every 30 minutes, ``0 0 * * * *`` means every hour, ``0 0 */2 * * *`` means every 2 hours.

#### Sync
```js
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
```js
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

**If these wrappers don't satisfy your needs, you still have access to the whole FB api by using `bot_util.facebook.api` and node-schedule by using `bot_util.schedule`**
