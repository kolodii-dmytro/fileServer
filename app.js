/**
 * Created by Zest 19.06.18
 * 
 * 
 */

'use strict';
const net = require('net');
const fs = require('fs');
let counter = 0;
let crlf = '\r\n'; // Это волшебная строчка CRLF (CR+LF).
const srv = net.createServer(connHandler); // Создаем сервер вне кластера. чтобы ВСЕ процессы о нем знали.

    srv.listen(8098); 



srv.on('error',(err)=>{
    console.log(err);
});

function connHandler(conn) {
    console.log('connected', conn.remoteAddress, conn.remotePort);
    let timeout;
    conn.on('data',(data)=>{
        let req = parseRequest(data);
        conn.emit('resolve', req);
    });

    conn.on('resolve',(data)=>{
        if(Array.isArray(data)){
            let binary = data.pop();
            //console.log(data);
            conn.write(data.join(crlf)); 

            conn.end(binary,'binary'); 
        }
        else {
            //console.log(data);
            conn.end(data);
        }
        counter++; 
        if(counter%100 === 0) console.log(process.pid, 'total:', counter);
    });

    conn.on('end',()=>{

    });

    conn.on('error',()=>{
        console.log('error in connection')
    });

}

function parseRequest(data){
    let paramsArr = data.toString().split(crlf);
    let getReqEx = /GET (\S+) HTTP\S+/;
    if(!getReqEx.test(paramsArr[0]))
        return `HTTP/1.1 405 Method Not Allowed`;

    let filePath = paramsArr[0].match(getReqEx)[1];

    if(filePath === '/') {
        filePath = '/index.html';
    }

    let fileData = getFile(filePath);

    if(!fileData)
        return `HTTP/1.1 404 Not Found`;

    let responseArr = [];
    responseArr.push(`HTTP/1.1 200 OK`);
    responseArr.push(`Server: AggroServer`);
    responseArr.push(`Date:${new Date()}`);
    responseArr.push(`Content-Type:${fileData.type}`);
    responseArr.push(`Content-Length:${fileData.length}`);

    responseArr.push(``);
    responseArr.push(``);
    responseArr.push(fileData.data);

    return responseArr;
}

function getFile(filePath){
    try {
        let fileData =  fs.readFileSync(__dirname+'/static'+filePath);
        let fileArr = [];
        let type = getContentType(filePath.split('.').pop());
        let filelength = fileData.length;
        return {data: fileData, type: type, length: filelength};
    }
    catch(e){
        return null;
    }
}

function getContentType(fileExt){
    let mime;
    switch (fileExt){
        case 'htm':
        case 'html':
            mime = 'text/html; charset=utf-8';
            break;
        case 'png':
            mime = 'image/png';
            break;
        case 'jpg':
        case 'jpeg':
            mime = 'image/jpeg';
            break;
        case 'gif':
            mime = 'image/gif';
            break;
        default: mime = 'text/plain';
    }
    //console.log(mime);
    return mime;
}

