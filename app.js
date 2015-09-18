/**
 * imooc
 *
 * Created by Awai on 15/9/14.
 */

/**
 *  修改储存目录 /xxx/xxx/ (最后要加一个 '/' )
 */
var savePath = ''
/**
 * 自己在慕课网上登录后 获取cookies 并替换下面的
 */
var cookies = ''

var superagent = require('superagent');
var cheerio = require('cheerio');
var fs = require('fs');

var courseId = process.argv.splice(2, 1);

var courseTitle = '';
var courseTotalCount = 0
var finishCount = 0

var download = function(url, filename, callback) {

    filename = filename.replace(/\(.*\)/,'') + '.mp4';

    var dirPath = savePath + courseTitle + '/'
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }

    console.log('开始下载第' + courseTotalCount + '个视频' + filename + ' 地址: ' + url);
    var writeStream = fs.createWriteStream(dirPath + filename);
    writeStream.on('close', function() {

        callback(filename);
    })

    var req = superagent.get(url)
    req.pipe(writeStream);

}

var getMovieUrl = function(id, callback) {
    superagent.get('http://www.imooc.com/course/ajaxmediainfo/?mid=' + id + '&mode=flash')
        .end(function(err, res) {
            var url = JSON.parse(res.text);

            if(url.result == 0) {
                url = url.data.result.mpath[0];
                callback(url);
            }
        })
}

var headers = {
    "Cache-Control": "max-age=0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Referer": "http://www.imooc.com/",
    "Accept-Encoding": "gzip, deflate, sdch",
    "Accept-Language": "zh-CN,zh;q=0.8",
    "Cookie": cookies
};

superagent
    .get('www.imooc.com/learn/' + courseId)
    .set(headers)
    .end(function(err, res) {

        var $ = cheerio.load(res.text);

        $('.course-infos .hd').find('h2').each(function(item) {
            courseTitle = $(this).text();
        })

        $('.chapter').each(function(item) {

            var videos = $(this).find('.video').children('li')

            videos.each(function(item) {
                var video = $(this).find('a')
                var filename = video.text().replace(/(^\s+)|(\s+$)/g,"");
                var id = video.attr('href').split('video/')[1]
                if (!id) {
                    console.log('跳过下载: ' + filename)
                }else {

                    // 获取下载地址
                    getMovieUrl(id, function(url) {

                        courseTotalCount ++;

                        // 开始下载
                        download(url, filename, function(_filename) {
                            finishCount++;
                            console.log('第' + finishCount + '个视频' + _filename + '下载完成')
                        })
                    })
                }
            })
        })
    })
