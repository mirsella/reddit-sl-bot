const Reddit = require('reddit')
require('dotenv').config()
const axios = require('axios');
const fs = require('fs-extra');

const config = fs.readJsonSync('./config.json');
const done = fs.readJsonSync('./done.json');
const writeconfig = async () => {
  fs.writeJsonSync('./done.json', done)
  console.log('wrote config')
}
const train = fs.readFileSync('train.txt').toString()

const reddit = new Reddit({
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
  appId: process.env.REDDIT_APP_ID,
  appSecret: process.env.REDDIT_APP_SECRET,
  userAgent: 'MyApp/1.0.0 (http://example.com)'
});

const post = config.post || false;
(async () => {
  const last = done.last
  config.sr.forEach(async (sr) => {
    api = `https://api.pushshift.io/reddit/comment/search?subreddit=${sr}&q=sl&after=${last}`;
    axios.get(api)
      .then((res) => {
        const comments = res.data.data;
        if (post == true) {
          for (comment of comments) {
            if (done.done.includes(comment.id)) {
              console.log('already done', comment.id)
              continue;
            }
            console.log(comment.body)
            if (config.blacklist.some(word => (comment.body).includes(word))) {
              console.log('word blacklisted', comment.body, comment.id)
              continue;
            }
            if ( ! (comment.body).test(/(^| )sl($| |\.)/gmi) ) {
              console.log("comment didn't match regex", comment.body)
              continue;
            }
            done.done.push(comment.id)
            done.last = comment.created_utc
            reddit.post('/api/comment', {
              api_type: 'json',
              text: train,
              thing_id: `t1_${comment.id}`
            })
              .then(e => {
                console.log('done', comment.id, 'https://reddit.com' + e.json.data.things[0].data.permalink)
                done.last = new Date().getTime().toString().slice(0, 10);
                done.done.push(comment.id);
                writeconfig()
              })
              .catch(console.error)
          }
        } else {
          console.log(sr, comments)
        }
      })
  })
})()
