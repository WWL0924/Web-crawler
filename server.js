const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3010;

// 导入爬虫模块
const { crawlTop10Movies } = require('./douban.js');

// 中间件
app.use(express.json());
app.use(express.static('public'));
app.use('/covers', express.static('covers'));

// 读取电影数据
const readMovieData = () => {
    try {
        const data = fs.readFileSync('douban.txt', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
};

// API接口：获取电影数据
app.get('/api/movies', (req, res) => {
    const movies = readMovieData();

    if (movies) {
        res.json({
            success: true,
            data: movies,
            total: movies.length,
            lastUpdated: fs.statSync('douban.txt').mtime
        });
    } else {
        res.json({
            success: false,
            error: '数据文件不存在，请先点击"更新数据"按钮'
        });
    }
});

// API接口：手动更新数据
app.post('/api/update', (req, res) => {
    console.log('开始手动更新电影数据...'); //这里都没打印出来

    try {
        const movies = crawlTop10Movies();//这里获取爬虫数据
        res.json({
            success: true,
            message: `成功更新 ${movies.length} 条电影数据`,
            data: movies
        });
    } catch (error) {
        res.json({
            success: false,
            error: '数据更新失败: ' + error.message
        });
    }
});

// API接口：检查数据状态
app.get('/api/status', (req, res) => {
    const movies = readMovieData();

    if (movies) {
        const stats = fs.statSync('douban.txt');
        res.json({
            success: true,
            hasData: true,
            movieCount: movies.length,
            lastUpdated: stats.mtime,
            fileSize: stats.size
        });
    } else {
        res.json({
            success: true,
            hasData: false,
            message: '暂无数据'
        });
    }
});

// 主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 管理页面
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`\n🎬 豆瓣电影数据展示服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 数据展示页面: http://localhost:${PORT}`);
    console.log(`🔧 数据管理页面: http://localhost:${PORT}/admin`);
    console.log('💡 首次使用请访问管理页面更新数据');
});