const Reddit = require('reddit')
require('dotenv').config()
const axios = require('axios');
const fs = require('fs-extra');

let config = fs.readJsonSync('./config.json');
const writeconfig = async () => fs.writeJsonSync('./config.json', config)
const train = fs.readFileSync('train.txt').toString()

const reddit = new Reddit({
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
  appId: process.env.REDDIT_APP_ID,
  appSecret: process.env.REDDIT_APP_SECRET,
  userAgent: 'MyApp/1.0.0 (http://example.com)'
});

(async () => {
  const last = config.last
  for (sr of config.sr) {
    api = `https://api.pushshift.io/reddit/comment/search/?subreddit=${sr}&q=sl&after=${last}` 
    await axios.get(api)
      .then((res) => {
        const comments = res.data.data;
        for (comment of comments) {
          reddit.post('/api/comment', {
            api_type: 'json',
            text: train,
            thing_id: `t1_${comment.id}`
          })
            .then(e => {
              console.log('done', 'https://reddit.com' + e.json.data.things[0].data.permalink)
              config.last = new Date().getTime().toString().slice(0, 10);
            })
            .catch(console.error)
        }
      })
  }
  writeconfig();
})()
