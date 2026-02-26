var fs = require('fs')

var request = require('sync-request')
var cheerio = require('cheerio')

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

var movieFromDiv = (div) => {
    var e = cheerio.load(div)

    // 创建一个电影类的实例并且获取数据
    // 这些数据都是从 html 结构里面人工分析出来的
    var movie = new Movie()
    movie.name = e('.title').text()
    movie.score = e('.rating_num').text()
    movie.quote = e('.inq').text()

    var pic = e('.pic')
    movie.ranking = pic.find('em').text()
    movie.coverUrl = pic.find('img').attr('src')

    let other = e('.other').text()
    movie.otherNames = other.slice(3).split(' / ').join('|')

    return movie
}

var cachedUrl = url => {
    // 1. 确定缓存的文件名
    var cacheFile = 'cached_html/' + url.split('?')[1] + '.html'
    // 2. 检查缓存文件是否存在
    // 如果存在就读取缓存文件
    // 如果不存在就下载并写入缓存文件
    var exists = fs.existsSync(cacheFile)
    if (exists) {
        var data = fs.readFileSync(cacheFile)
        // log('data', data)
        return data
    } else {
        // 用 GET 方法获取 url 链接的内容
        // 相当于你在浏览器地址栏输入 url 按回车后得到的 HTML 内容
        var r = request('GET', url)
        // utf-8 是网页文件的文本编码
        var body = r.getBody('utf-8')
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

var moviesFromUrl = (url) => {
    var body = cachedUrl(url)
    // cheerio.load 用来把 HTML 文本解析为一个可以操作的 DOM
    var e = cheerio.load(body)

    // 一共有 25 个 .item
    var movieDivs = e('.item')
    // 循环处理 25 个 .item
    var movies = []
    for (var i = 0; i < movieDivs.length; i++) {
        var div = movieDivs[i]
        // 扔给 movieFromDiv 函数来获取到一个 movie 对象
        var m = movieFromDiv(div)
        movies.push(m)
    }
    return movies
}

var saveMovie = (movies) => {
    // JSON.stringify 第 2 3 个参数配合起来是为了让生成的 json
    // 数据带有缩进的格式，第三个参数表示缩进的空格数
    // 建议当套路来用
    // 如果你一定想要知道原理，看下面的链接（不建议看）
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    var s = JSON.stringify(movies, null, 2)
    // 把 json 格式字符串写入到 文件 中
    var fs = require('fs')
    var path = 'douban.txt'
    fs.writeFileSync(path, s)
}

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
    for (var i = 0; i < 10; i++) {
        var start = i * 25
        var url = `https://movie.douban.com/top250?start=${start}&filter=`
        var moviesInPage = moviesFromUrl(url)
        // 注意, 这个是 ES6 的语法
        movies = [...movies, ...moviesInPage]
        // 常规语法
        // movies = movies.concat(moviesInPage)
    }
    log('movies', movies)
    saveMovie(movies)
    downloadCovers(movies)
}

__main()