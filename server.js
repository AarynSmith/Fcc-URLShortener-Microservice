'use strict';

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');

var mongoose = require('mongoose');
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

var app = express();
app.use(cors({optionsSuccessStatus: 200}));

var port = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI, mongooseOptions);
const ShortUrlSchema = mongoose.Schema({
  url: {type: String, required: true},
  short: Number,
})
const ShortUrl = mongoose.model("ShortUrl", ShortUrlSchema);

app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', (req, res) => res.sendFile(process.cwd() + '/views/index.html'));

app.post('/api/shorturl/new', (req, res) => {
  let u;
  try {
    u = new url.URL(req.body.url)
  } catch (err) {
    res.json({error: 'invalid URL'})
  }
  dns.lookup(u.host, (err) => {
    if (err) return res.json({error: 'invalid URL'});
  });

  if (u.protocol !== 'http:' && u.protocol !== 'https:')
    return res.json({error: 'invalid URL'});

  ShortUrl.find().sort({short: -1}).select({short: 1}).limit(1).exec((err, data) => {
    if (err) return console.log(err);
    const shortID = data[0].short + 1;

    const Url = new ShortUrl({
      url: req.body.url,
      short: shortID,
    })

    Url.save((err, data) => {
      if (err) return res.json({error: err});
      res.json({original_url: req.body.url, short_url: shortID})
    })
  })
});

app.get('/api/shorturl/:shortID', (req, res) => {
  ShortUrl.findOne({short: req.params.shortID}, (err, data) => {
    if (err) return res.json({error: err});
    if (!data) return res.json({error: 'url not found'})
    res.redirect(data.url)
  })
})

app.listen(port, () => console.log('Node.js listening on port', port, '...'));