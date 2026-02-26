var fs = require('fs')

var request = require('sync-request')
var cheerio = require('cheerio')
const { moveCursor } = require('readline')
const { time } = require('console')

// ES6 定义一个类
class Movie {
    constructor() {
        // 分别是电影名/评分/引言/排名/封面图片链接
        this.name = ''
        this.score = 0
        this.quote = ''
        this.ranking = 0
        this.coverUrl = ''
        this.otherName = ''
    }
}

// 清洗数据的例子
// var clean = (movie) => {
//     var m = movie
//     var o = {
//         name: m.Name,
//         score: Number(m.score),
//         quote: m._quote,
//         ranking: m.ranking,
//         coverUrl: m.coverUrl,
//         otherNames: m.Other_Names,
//     }
//     return o
// }

var log = console.log.bind(console)


//从html字符串中逐个获取数据
var movieFromDiv = (div) => {
    var e = cheerio.load(div)
    let movies = []
    // log('----------', e('.rating_num').text().slice(1 * 3, 1 * 3 + 3), '------------')


    //怎么找到第几个呢
    for (let i = 0; i < 10; i++) {
        var movie = new Movie()
        movie.name = e('.title').text().split('/')[i] //名字
        movie.score = e('.rating_num').text().slice(i * 3, i * 3 + 3) //评分
        let tip = 2 * i + 1
        movie.quote = e('.quote').text().split('\n')[tip] //引用

        var pic = e('.pic')
        movie.ranking = pic.find('em').text()[i] //排名
        //这里图片地址 要找到相应的地址
        movie.coverUrl = pic.find('img').eq(i).attr('src')

        let other = e('.other').eq(i).text()
        movie.otherNames = other
        movies.push(movie)
    }
    console.log('最终爬到的个数', movies.length);

    return movies
}

//url解析成html字符串
var cachedUrl = (url) => {
    // var cacheFile = 'cached_html' + url.split('?')[1] + '.html'
    var cacheFile = 'cached_html' + '豆瓣电影' + '.html'

    var exists = fs.existsSync(cacheFile)
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        return data
    } else {
        //访问网页
        var r = request('GET', url) //同步
        //从响应里取出网页内容 按照utf-8编码转成字符串
        var body = r.getBody('utf-8')
        //把刚下载的 HTML 内容写入本地文件
        fs.writeFileSync(cacheFile, body) //同步
        return body
    }
}


//持久化储存
var saveMovie = (movies) => {
    // JSON.stringify 第 2 3 个参数配合起来是为了让生成的 json
    // 数据带有缩进的格式，第三个参数表示缩进的空格数
    // 建议当套路来用
    // 如果你一定想要知道原理，看下面的链接（不建议看）
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    var s = JSON.stringify(movies, null, 2)
    // 把 json 格式字符串写入到 文件 中
    var fs = require('fs') //引入读写模块
    var path = 'douban.txt'
    fs.writeFileSync(path, s)
}

//静态资源下载
var downloadCovers = (movies) => {
    for (var i = 0; i < movies.length; i++) {
        var m = movies[i]
        var url = m.coverUrl
        // 保存图片的路径
        var path = 'covers/' + m.name.split('/')[0] + '.jpg'
        var r = request('GET', url)
        var img = r.getBody()
        fs.writeFileSync(path, img)
    }
}

var __main = () => {
    // 主函数
    var movies = []
    // var url = `https://movie.douban.com/top250?start=${start}&filter=`
    let url = `https://movie.douban.com/top250`
    //这里怎么确定爬的是第几个呢

    var string = cachedUrl(url)
    //这里逐个
    movies = movieFromDiv(string)


    // log('最终爬取的数据movies', movies)
    saveMovie(movies)
    downloadCovers(movies)
}

__main()