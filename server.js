var ws = require("nodejs-websocket")
var md5 = require('md5-node');
var services = new Object();
const fs = require("fs");
const chinaTime = require('china-time');
const {
    Console
} = require('console');
const output = fs.createWriteStream('./log.log', {
    flags: 'a'
});
const errOutput = fs.createWriteStream('./err.log', {
    flags: 'a'
});
const logger = new Console({
    stdout: output,
    stderr: errOutput
});
logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + ">", "DEGINX-WEBSOCKET服务开始运行!")
var server = ws.createServer(function(conn) {
    var sender_ip_str = "IpAddress:[" + conn.socket.remoteAddress + "]";
    conn.sendText("连接成功")
    logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, "连接成功");
    conn.on("text", function(json) {
        conn.info = JSON.parse(json);
        check_id(conn.info.uuid, conn.info.key, function(result) {
            if (result.length == 0) {
                conn.sendText(sender_ip_str + " 发送数据失败,权限验证不匹配!")
                logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, "发送数据失败,权限验证不匹配!")
            } else {
                send_msg(conn)
            }
        })
    })
    conn.on("close", function(code, reason) {
        if ("info" in conn) {
            if ("uuid" in conn.info) {
                logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, sender_uuid_str, '已断开, 代码:', code)
            } else {
                sender_uuid_str = "UUID:{" + conn.info.uuid + "}";
                logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, '已断开, 代码:', code)
            }
        } else {
            logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, '已断开, 代码:', code)
        }
    })
}).listen(10086)

function send_msg(conn) {
    Info = conn.info;
    if (!(Info.group in services)) {
        objs = {}
        services[Info.group] = objs
    }
    conn.uuid = Info.uuid;
    obj = {
        'ws': conn
    };
    content = {
        'sender_uuid': conn.info.uuid,
        'sender_group': conn.info.group,
        'sender_ip': conn.socket.remoteAddress
    };
    sender_ip_str = "IpAddress:[" + conn.socket.remoteAddress + "]";
    services[Info.group][Info.uuid] = obj;
    sender_group_str = "Group:(" + conn.info.group + ")";
    sender_uuid_str = "UUID:{" + conn.info.uuid + "}";
    recipient_group = "Group:(" + conn.info.send_msg.recipient_group + ")";
    send_content = "Content:\"" + conn.info.send_msg.msg_content + "\"";
    switch (Info.action) {
        case "send_msg_to_group":
            content.recipient_group = conn.info.send_msg.recipient_group;
            content.content = conn.info.send_msg.msg_content;
            if (Info.send_msg.recipient_group in services) {
                for (let uuid in services[Info.send_msg.recipient_group]) {
                    services[Info.send_msg.recipient_group][uuid].ws.sendText(JSON.stringify(content))
                }
                logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, sender_group_str, sender_uuid_str, "=>", recipient_group, send_content, "发送数据成功");
                result = {
                    'code': "200",
                    'msg': "发送数据成功"
                };
                conn.sendText(JSON.stringify(result));
            } else {
                logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, sender_group_str, sender_uuid_str, "=>", recipient_group, send_content, "发送数据失败, 该群组不存在");
                result = {
                    'code': "404",
                    'msg': "发送数据失败, 该群组无终端在线或不存在"
                };
                conn.sendText(JSON.stringify(result));
            }
            break;
        case "send_msg_to_uuid":
            content.recipient_group = conn.info.send_msg.recipient_group;
            content.content = conn.info.send_msg.msg_content;
            if (Info.send_msg.recipient_group in services) {
                recipient_uuid_str = "UUID:{" + Info.send_msg.recipient_uuid + "}";
                if (Info.send_msg.recipient_uuid in services[Info.send_msg.recipient_group]) {
                    content.recipient_uuid = Info.send_msg.recipient_uuid;
                    content.recipient_group = Info.send_msg.recipient_group;
                    services[Info.send_msg.recipient_group][Info.send_msg.recipient_uuid].ws.sendText(JSON.stringify(content))
                    recipient_ip_str = "IpAddress:[" + services[Info.send_msg.recipient_group][Info.send_msg.recipient_uuid].ws.socket.remoteAddress + "]";
                    logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, sender_group_str, sender_uuid_str, "=>", recipient_ip_str, recipient_group, recipient_uuid_str, send_content, "发送数据成功");
                    result = {
                        'code': "200",
                        'msg': "发送数据成功"
                    };
                    conn.sendText(JSON.stringify(result));
                } else {
                    logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, sender_group_str, sender_uuid_str, "=>", recipient_group, recipient_uuid_str, send_content, "发送数据失败, 该群组不存在");
                    result = {
                        'code': "404",
                        'msg': "发送数据失败, 该UUID不在线或不存在"
                    };
                    conn.sendText(JSON.stringify(result));
                }
            } else {
                logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + sender_ip_str, sender_group_str, sender_uuid_str, "=>", recipient_group, send_content, "发送数据失败, 该群组不存在");
                result = {
                    'code': "404",
                    'msg': "发送数据失败, 该群组无终端在线或不存在"
                };
                conn.sendText(JSON.stringify(result));
            }
            break;
        case "none":
            break;
    }
}

function check_id(uuid, key, callback) {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'websocket',
        password: 'zs4EPdz3SSRZezWS',
        database: 'websocket'
    });
    connection.connect();
    var Sql = "SELECT * FROM uuid_list WHERE `uuid`= ? AND `key`= ?";
    var SqlParams = [md5(uuid), md5(key)];
    //查
    var results;
    connection.query(Sql, SqlParams, function(err, result) {
        if (err) {
            logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + '[SELECT ERROR] - ', err.message);
            return;
        }
        callback(result)
    });
    connection.end();
}
process.on('uncaughtException', function(err) {
    //打印出错误
    logger.log("<" + chinaTime('YYYY-MM-DD HH:mm:ss') + "> " + err);
});