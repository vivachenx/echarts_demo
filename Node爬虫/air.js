"use strict"

const request = require('request')
const cheerio = require('cheerio')

const log = function() {
    console.log.apply(console, arguments)
}

const Data = function() {
    this.name = ''
    this.value = 0
}

const saveJSON = function(path, data) {
    const fs = require('fs')
    const s = JSON.stringify(data, null, 4)
    fs.writeFile(path, s, function(error){
        if (error !== null) {
            log('*** 写入文件错误', error)
        } else {
            log('--- 保存成功')
        }
    })
}

const dataFromJSON = function(data, json) {
    var airObjects = JSON.parse(json)
    for (var i = 0; i < airObjects.length; i++) {
        var airObject = airObjects[i]
        var object = new Data()

        object.name = airObject.CITY.split('市')[0]
        object.value = parseInt(airObject.AQI)
        data.push(object)
    }
}

const jsonFromBody = function(body) {
    const options = {
        decodeEntities: false
    }

    const e = cheerio.load(body, options)
    const json = e('#gisDataJson').attr('value')
    // const data = dataFromJSON(json)

    return json
}

const writeToFile = function(path, data) {
    const fs = require('fs')
    fs.writeFile(path, data, function(error){
        if (error !== null) {
            log('*** 写入失败', path)
        } else {
            log('--- 写入成功', path)
        }
    })
}

const cachedUrl = function(pageNum, callback) {
    const fs = require('fs')

    var formData = {
          'page.pageNo': `${pageNum}`,
          'xmlname': '1462259560614'
    }

    var postData = {
        url: 'http://datacenter.mep.gov.cn:8099/ths-report/report!list.action',
        formData: formData
    }

    const path = postData.url.split('/').join('-').split(':').join('-') + '-' + `${pageNum}`
    // log('path :', path)

    fs.readFile(path, function(err, data){
        if (err !== null) {
            // log('*** 读取文件失败', err)
            request.post(postData, function(error, response, body) {
                if (error === null) {
                    // log('*** 请求成功', body)
                    writeToFile(path, body)
                    callback(error, response, body)
                }
            })
        } else {
            log('读取到缓存的页面', path)
            const response = {
                statusCode: 200
            }
            callback(null, response, data)
        }
    })
}

const __main = function() {
    const data = []
    const path = 'airData.txt'

    for (var i = 1; i < 11; i++) {
        // log('i :', i)
        cachedUrl(i, function(error, response, body){
            if (error === null && response.statusCode === 200) {
                // log('body', body)
                const json = jsonFromBody(body)
                dataFromJSON(data, json)
                // log(data)
                saveJSON(path, data)
            } else {
                log('*** 请求失败', error)
            }
        })
    }
}

__main()
