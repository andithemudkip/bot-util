//TODO
// * DOCS
// * COMMENT CODE

let FB = require('fb');
let fs = require('fs');
let FbId = require('fb-id');
let fbId = new FbId();
let xtend = require('xtend');
let isUrl = require('is-url');
let fbVideoUpload = require('facebook-api-video-upload');
let schedule = require('node-schedule');

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

class Page {
    constructor(platform, id, accessToken, name){
        this.platform = platform;
        this.id = id;
        this.accessToken = accessToken;
        this.scheduledPosts = [];
        if(name.length) this.name = name;
        else this.name = 'page_' + Platforms[this.platform].pages.all.length;
        this.get = {
            reactions: obj_id => {
                return new Promise((resolve, reject) => {
                    if(typeof obj_id == 'string' || typeof obj_id == 'number'){
                        FB.setAccessToken(this.accessToken);
                        FB.api(`${obj_id}/reactions`, 'get', {}, res => {
                            if (res && !res.error) {
                                resolve(res);
                            } else reject(res);
                        });
                    } else throw new Error(`Invalid or missing object ID in 'get.reactions'`);
                });
            },
            posts: {
                all: () => {
                    return new Promise((resolve, reject)=>{
                        FB.setAccessToken(this.accessToken);
                        FB.api(`${this.id}/feed`, (res, err)=>{
                            if(err) reject(err);
                            else {
                                resolve(res);
                            }
                        });
                    });
                },
                latest: () => {
                    return new Promise((resolve, reject)=>{
                        FB.setAccessToken(this.accessToken);
                        FB.api(`${this.id}/feed`, (res, err)=>{
                            if(err) reject(err);
                            else {
                                resolve(res.data[0]);
                            }
                        });
                    });
                }
            },
            comments: obj_id => {
                return new Promise((resolve, reject) => {
                    if(typeof obj_id == 'string' || typeof obj_id == 'number'){
                        FB.setAccessToken(this.accessToken);
                        FB.api(`${obj_id}/comments`, 'get', {}, res => {
                            if (res && !res.error) {
                                resolve(res);
                            } else reject(res);
                        });
                    } else throw new Error(`Invalid or missing object ID in 'get.comments'`);
                });
            }
        }
    }
    
    Comment(obj){
        return new Promise((resolve, reject) => {
            if(typeof obj.on == 'string' || typeof obj.on == 'number'){
                if(typeof obj.message != undefined && obj.message.length){
                    FB.setAccessToken(this.accessToken);
                    // COMMENT HAS AN IMAGE ATTACHMENT
                    if(typeof obj.source == 'string' || obj.source instanceof fs.ReadStream){
                        if(obj.source instanceof fs.ReadStream){
                            FB.api(`${obj.on}/comments`, 'post', { message: obj.message, source: obj.source }, res => {
                                if(!res || res.error){
                                    reject(!res ? 'error occurred' : res.error);
                                    return;
                                }
                                resolve(res);
                            });
                        }
                        else if (typeof obj.source == 'string'){
                            FB.api(`${obj.on}/comments`, 'post', { message: obj.message, source: fs.createReadStream(obj.source) }, res => {
                                if(!res || res.error){
                                    reject(!res ? 'error occurred' : res.error);
                                    return;
                                }
                                resolve(res);
                            });
                        }
                        else throw new Error('Invalid source for photo comment.')
                    }
                    // COMMENT IS TEXT ONLY
                    else {
                        FB.api(`${obj.on}/comments`, 'post', { message: obj.message }, res => {
                            if(!res || res.error){
                                reject(!res ? 'error occurred' : res.error);
                                return;
                            }
                            resolve(res);
                        });
                    }
                }
                else throw new Error(`'message' parameter missing or empty. The 'message' parameter must be 1 or more characters.`);
                
            }
            else throw new Error(`Missing parameter 'on' from comment.`);
        });
    }

    SchedulePost(scheduleRule, func){
        return new Promise((resolve, reject) => {
            if(isFunction(func)){
                let job = schedule.scheduleJob(scheduleRule, ()=>{
                    if(func() instanceof Promise){
                        func().then(o => {
                            this.Post(o).then(res => {
                                if(o.hasOwnProperty('onPosted')){
                                    o.onPosted(res);
                                }
                            }).catch(err => {
                                console.log(err);
                            });
                        });
                    }
                    else{
                        let obj = func();
                        this.Post(obj).then(res => {
                            if(obj.hasOwnProperty('onPosted')){
                                obj.onPosted(res);
                            }
                        }).catch(err => {
                            console.log(err);
                        });
                    }
                });
                this.scheduledPosts.push(job);
                resolve(job);
            }
        });
    }

    Post(obj){
        return new Promise((resolve, reject) => {
            if(typeof obj.type == 'string'){
                FB.setAccessToken(this.accessToken);
                switch(obj.type.toLowerCase()){
                    case "text":
                        if(typeof obj.description == 'string' || typeof obj.description == 'number') obj.message = obj.description.toString();
                        if(typeof obj.caption == 'string' || typeof obj.caption == 'number') obj.message = obj.caption.toString();
                        if(obj.message && (typeof obj.message == 'string' || typeof obj.message == 'number')){
                            FB.api(`${this.id}/feed`, 'post', { message: obj.message }, res => {
                                if(!res || res.error || res.error_user_title){
                                    reject(!res ? 'error occurred' : res.error);
                                    return;
                                }
                                if(typeof obj.comment == 'object'){
                                    obj.comment.on = res.id;
                                    this.Comment(obj.comment).then(comres => {
                                        res.comment_id = comres.id;
                                        resolve(res);
                                    });
                                }
                                else resolve(res);
                            })
                        }
                        else throw new Error(`Missing parameter 'message' from post.`);
                        break;
                    case "image":
                        obj = xtend({
                            caption: ''
                        }, obj);
                        if(typeof obj.message == 'string' || typeof obj.message == 'number') obj.caption = obj.message.toString();
                        if(typeof obj.description == 'string' || typeof obj.description == 'number') obj.caption = obj.description.toString();

                        if(obj.source instanceof fs.ReadStream){ 
                            FB.api(`${this.id}/photos`, 'post', {source: obj.source, caption: obj.caption}, res => {
                                if(!res || res.error || res.error_user_title){
                                    reject(!res ? 'error occurred' : res.error);
                                    return;
                                }
                                res.id = res.post_id;
                                if(typeof obj.comment == 'object'){
                                    obj.comment.on = res.id
                                    this.Comment(obj.comment).then(comres => {
                                        res.comment_id = comres.id;
                                        resolve(res);
                                    }).catch(error => {
                                        reject(error);
                                    });
                                }
                                else resolve(res);
                            });
                        }
                        else if(typeof obj.source == 'string'){
                            FB.api(`${this.id}/photos`, 'post', {source: fs.createReadStream(obj.source), caption: obj.caption}, res => {
                                if(!res || res.error || res.error_user_title){
                                    reject(!res ? 'error occurred' : res.error);
                                    return;
                                }
                                res.id = res.post_id;
                                if(typeof obj.comment == 'object'){
                                    obj.comment.on = res.id
                                    this.Comment(obj.comment).then(comres => {
                                        res.comment_id = comres.id;
                                        resolve(res);
                                    }).catch(error => {
                                        reject(error);
                                    });
                                }
                                else resolve(res);
                            });
                        }
                        else throw new Error('Invaid source. Must be a path or a ReadStream');
                        break;
                    case "video":
                        if(obj.source){
                            if(typeof obj.source == 'string')
                                obj.stream = fs.createReadStream(obj.source);
                            if(typeof obj.message == 'string' || typeof obj.message == 'number') obj.description = obj.message.toString();
                            if(typeof obj.caption == 'string' || typeof obj.caption == 'number') obj.description = obj.caption.toString();
                            obj = xtend({
                                token: this.accessToken,
                                id: this.id,
                                title: '',
                                description: ''
                            }, obj);
                            fbVideoUpload(obj).then(res => {
                                res.id = res.video_id;
                                if(typeof obj.comment == 'object'){
                                    obj.comment.on = res.id
                                    this.Comment(obj.comment).then(comres => {
                                        res.comment_id = comres.id;
                                        resolve(res);
                                    }).catch(error => {
                                        reject(error);
                                    });
                                }
                                else resolve(res);
                            }).catch(e => {
                                reject(e);
                            });
                        }
                        else throw new Error('Source undefined.')
                        break;
                }
            }
            else throw new Error('Type of post not specified');
        });
    }
}

let Platforms = {
    Facebook: {
        api: FB.api,
        pages: {
            all: []
        },
        AddPage: function(id, accessToken, name = ''){
            return new Promise((resolve, reject) => {
                if(typeof accessToken == 'string'){
                    if(typeof id == 'string' || typeof id == 'number'){
                        if(isUrl(id)){
                            fbId.getId(id, id=>{
                                let page = new Page('Facebook', id, accessToken, name);
                                this.pages.all.push(page);
                                this.pages[id.toString()] = page;
                                resolve(id);
                            });
                        } else {
                            let page = new Page('Facebook', id, accessToken, name);
                            this.pages.all.push(page);
                            this.pages[id.toString()] = page;
                            resolve(id);
                        }
                    }
                }
                else reject('Access token must be a string.');
            })
        }
    },
    Discord: {

    }
}

module.exports = {
    facebook: Platforms.Facebook,
    schedule: schedule
}
