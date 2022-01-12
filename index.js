const Reddit = require('reddit')
require('dotenv').config()
const axios = require('axios');
const fs = require('fs-extra');

const config = fs.readJsonSync('./config.json');
const writeconfig = async () => {
  fs.writeJsonSync('./config.json', config)
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

let requests = []
const post = config.post || false;
(async () => {
  const last = config.last
  config.sr.forEach(async (sr) => {
    api = `https://api.pushshift.io/reddit/comment/search?subreddit=${sr}&q=sl&after=${last}`;
    requests.push(axios.get(api)
      .then((res) => {
        const comments = res.data.data;
        if (post == true) {
          for (comment of comments) {
            if (config.done.includes(comment.id)) {
              console.log('already done', comment.id)
              continue;
            }
            requests.push(reddit.post('/api/comment', {
              api_type: 'json',
              text: train,
              thing_id: `t1_${comment.id}`
            })
              .then(e => {
                console.log('done', comment.id, 'https://reddit.com' + e.json.data.things[0].data.permalink)
                config.last = new Date().getTime().toString().slice(0, 10);
                config.done.push(comment.id);
              })
              .catch(console.error)
            )
          }
        } else {
          console.log(sr, comments)
        }
      })
    )
  })
  Promise.all(requests).then(() => {
    writeconfig()
  })
})()
