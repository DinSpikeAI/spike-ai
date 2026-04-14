const fs = require('fs');
const home = process.env.USERPROFILE + '/Downloads/';

const draft = home + 'draft-route-v2.ts';
if (fs.existsSync(draft)) { fs.copyFileSync(draft, 'src/app/api/draft/route.ts'); console.log('draft OK'); }
else { console.log('draft NOT FOUND'); }

const tweet = home + 'tweet-route-v3.ts';
if (fs.existsSync(tweet)) { fs.copyFileSync(tweet, 'src/app/api/tweet/route.ts'); console.log('tweet OK'); }
else { console.log('tweet NOT FOUND'); }
