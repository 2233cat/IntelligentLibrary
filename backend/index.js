const http = require('http');
const https = require('https');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 日志文件路径
const logFile = path.join(__dirname, 'server.log');

// 自定义日志函数
function log(...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}\n`;
  console.log(...args);
  fs.appendFileSync(logFile, logMessage);
}

// 手动读取和解析.env文件
let API_KEY = '';
let PORT = 3000;
let API_BASE = 'https://maas-api.cn-huabei-1.xf-yun.com/v1';

try {
  const envPath = path.join(__dirname, '.env');
  log('读取.env文件路径:', envPath);
  const envContent = fs.readFileSync(envPath, 'utf8');
  log('env文件内容:', envContent);
  
  // 解析.env文件内容
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        
        if (cleanKey === 'XUNFEI_API_KEY') {
          API_KEY = cleanValue;
          log('从.env文件读取API_KEY:', API_KEY);
        } else if (cleanKey === 'PORT') {
          PORT = parseInt(cleanValue) || 3000;
          log('从.env文件读取PORT:', PORT);
        } else if (cleanKey === 'API_BASE') {
          API_BASE = cleanValue;
          log('从.env文件读取API_BASE:', API_BASE);
        }
      }
    }
  }
  
  log('手动加载环境变量成功');
  log('API_KEY:', API_KEY.length > 0 ? '已设置' : '为空');
  log('PORT:', PORT);
  log('API_BASE:', API_BASE);
} catch (error) {
  log('手动加载环境变量失败:', error.message);
  // 使用默认值
  API_KEY = '008d0726015051de2c46524327401f96:ODhiZmE2OGE0ZDM2ZDYyMTQ3ZGZlY2Ix';
  PORT = 3000;
  API_BASE = 'https://maas-api.cn-huabei-1.xf-yun.com/v2';
  log('使用默认环境变量值');
}

log('=== 服务器启动 ===');
log('API_KEY:', API_KEY ? '已配置' : '未配置');
log('PORT:', PORT);
log('API_BASE:', API_BASE);
// 创建与简化版服务器完全相同的HTTP服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // 只处理POST请求到/api/chat
  if (req.method === 'POST' && req.url === '/api/chat') {
    log('=== 收到POST请求到/api/chat ===');
    let body = '';
    
    // 接收请求体
    req.on('data', (chunk) => {
      body += chunk;
    });
    
    req.on('end', () => {
      try {
        log('请求体:', body);
        const requestData = JSON.parse(body);
        const { messages } = requestData;
        
        log('=== 收到请求 ===');
        log('消息:', JSON.stringify(messages));
        
        // 所有请求都使用流式处理
        handleStreamRequest(messages, res);
      } catch (error) {
        log('解析请求体错误:', error.message);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: '请求格式错误' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    // 健康检查端点
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', message: 'AI Chat API is running' }));
  } else {
    res.statusCode = 404;
    res.end();
  }
});

// 处理流式请求
function handleStreamRequest(messages, res) {
  // 创建与简化版服务器完全相同的请求体
  const requestBody = {
    model: 'xop3qwen1b7',
    messages: messages,
    max_tokens: 4000,
    temperature: 0.7,
    stream: true
  };
  
  // 创建与简化版服务器完全相同的请求选项
  // 解析API_BASE获取hostname和path
  const apiUrl = new URL(API_BASE);
  const options = {
    hostname: apiUrl.hostname,
    port: 443,
    path: '/v2/chat/completions',
    method: 'POST',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'User-Agent': 'Node.js-Client',
      'Accept': '*/*'
    }
  };
  
  log('发送到MaaS的请求体:', JSON.stringify(requestBody));
  log('请求选项:', JSON.stringify(options));
  
  // 创建请求（与简化版服务器完全相同的方式）
  const maasReq = https.request(options, (maasRes) => {
    log('\n=== MaaS API 响应 ===');
    log('状态码:', maasRes.statusCode);
    log('响应头:', JSON.stringify(maasRes.headers));
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // 处理错误状态码
    if (maasRes.statusCode !== 200) {
      let errorBody = '';
      maasRes.on('data', (chunk) => {
        errorBody += chunk;
      });
      maasRes.on('end', () => {
        log('错误响应体:', errorBody);
        try {
          const errorJson = JSON.parse(errorBody);
          const errorMessage = errorJson.error?.message || 'API调用失败';
          res.write(`data: {"error": {"message": "${errorMessage}"}} \n\n`);
        } catch (parseError) {
          res.write(`data: {"error": {"message": "API调用失败: ${maasRes.statusCode}"}} \n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      });
    } else {
      // 直接将MaaS响应的数据发送给客户端
      maasRes.pipe(res);
      
      // 响应结束时记录日志
      maasRes.on('end', () => {
        log('\n=== 响应结束 ===');
        // 不再手动发送[DONE]，因为pipe()已经关闭了连接
      });
    }
  });
  
  // 错误处理
  maasReq.on('error', (error) => {
    log('\n=== 请求错误 ===');
    log('错误:', error.message);
    
    res.write(`data: {"error": "流式请求失败：${error.message}"} \n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });
  
  // 超时处理
  maasReq.on('timeout', () => {
    log('\n=== 请求超时 ===');
    maasReq.destroy();
    
    res.write(`data: {"error": "请求超时"} \n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });
  
  // 发送请求体
  maasReq.write(JSON.stringify(requestBody));
  maasReq.end();
  
  log('\n=== 请求已发送 ===');
}

// 启动服务器
server.listen(PORT, () => {
  log(`Server is running on http://localhost:${PORT}`);
});
