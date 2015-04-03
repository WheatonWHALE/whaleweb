var express     = require('express'),
    githubAPI   = require("github");

var basePath = './sub-projects/feedback/';
var GITHUB_OAUTH = process.env.ISSUES_KEY;

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
            password: GITHUB_OAUTH
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
