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


//url解析成html字符串
var cachedUrl = (url) => {
    console.log('1---url解析成html字符串')
    var cacheFile = 'cached_html' + url.split('/')[1] + '.html'
    console.log('文件名', url.split('/')[1])

    var exists = fs.existsSync(cacheFile)
    //这里如果缓存文件存在优先读取缓存文件 这已经达到了啊
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        return data
    } else {
        //访问网页
        // var r = request('GET', url) //同步
        var r = request('GET', url)
        //从响应里取出网页内容 按照utf-8编码转成字符串
        var body = r.getBody('utf-8')
        //把刚下载的 HTML 内容写入本地文件
        fs.writeFileSync(cacheFile, body) //同步
        return body
    }
}


var movieFromDiv = (div) => {
    console.log('2---div中截取内容')
    var e = cheerio.load(div)
    let movies = []

    // 选择所有电影项
    var movieItems = e('.grid_view > li')

    // 遍历每个电影项
    movieItems.each((index, item) => {
        // 只取前10个
        if (index >= 10) return false

        var movie = new Movie()
        var $item = e(item) // 电影项 转换为 Cheerio 元素

        // 提取排名
        movie.ranking = $item.find('.pic em').text()

        // 提取标题（只保存中文标题）
        var title = $item.find('.title').first().text()
        movie.name = title
        // 提取评分
        movie.score = $item.find('.rating_num').text()

        // 提取引用
        movie.quote = $item.find('.quote span').text()

        // 提取封面图片
        movie.coverUrl = $item.find('.pic img').attr('src')

        // 提取其他名称
        var other = $item.find('.other').text()
        movie.otherNames = other ? other.trim() : ''

        movies.push(movie)
    })

    console.log('最终爬到的个数', movies.length)
    return movies
}


//持久化储存
var saveMovie = (movies) => {
    console.log('3---持久化储存')
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
        // var safeName = m.name.replace(/[\\/:*?"<>|]/g, '')
        var path = 'covers/' + m.name + '.jpg'
        var r = request('GET', url)
        var img = r.getBody()
        fs.writeFileSync(path, img)
        console.log('保存图片')
    }
}

// 专门爬取前10条电影数据的函数
var crawlTop10Movies = () => {
    var movies = []
    let url = `https://movie.douban.com/top250`

    console.log('开始爬取豆瓣电影Top10...')
    var string = cachedUrl(url)
    movies = movieFromDiv(string)

    // 只取前10条
    var top10Movies = movies.slice(0, 10)

    console.log(`成功爬取 ${top10Movies.length} 条电影数据`)
    saveMovie(top10Movies)
    downloadCovers(top10Movies)
    console.log(`成功存入本地`)
    return top10Movies
}

//导出这个函数
module.exports = { crawlTop10Movies }