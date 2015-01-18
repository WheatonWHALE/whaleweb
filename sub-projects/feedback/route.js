var express     = require('express'),
    githubAPI   = require("github");

var basePath = './sub-projects/feedback/';

var app = express();

app.set('views', basePath + 'views/');

app.use('/css', express.static(basePath + 'css/'));
app.use('/js',  express.static(basePath + 'js/'));

app.route('/').get(function(req, res) {
        res.render('feedback.jade');
    })
    // Posts on the feedback are recreated as GitHub issues
    .post(function(req, res) {
        var url = 'https://api.github.com/repos/WheatonWHALE/whaleweb/issues';
        var headers = {
            'User-Agent': 'bawjensen'
        }

        var title = req.body.subject + ': ' + req.body.title;
        var body = 'Posted by ' + req.body.name + ':\n\n' + req.body.feedback;

        var github = new githubAPI({
            version: '3.0.0'
        });

        github.authenticate({
            type: "basic",
            username: 'bawjensen',
            password: 'a3db061e48f534e35b620e6bb8b5abb0800e0618'
        });

        github.issues.create({
            title:      title,
            body:       body,
            user:       'WheatonWHALE',
            repo:       'whaleweb',
            labels:     []
        }, function handleResponse(err, data) {
            if (err) {
                console.error(err);
            }
            else {
                res.locals.issueURL = data.html_url;
                res.render('thanks.jade');
            }
        });
    });

module.exports = app;