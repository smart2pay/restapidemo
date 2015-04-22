var jade = require('jade')
var request = require('request')
var fs = require('fs')
var url = require('url')
var winston = require('winston')
var mylogger = require('../node_modules_my/logger')
var logger = mylogger()

var config = require('config');
process.env['ALLOW_CONFIG_MUTATIONS'] = true //needed to change MerchantTransactionID (!!!)


exports.init = function(req,res){
		var paymentRequest = config.get('testData')
		var num = Math.ceil(Math.random()*10000000)
		paymentRequest.Payment.MerchantTransactionID = num
		paymentRequest.BasicAuth = new Buffer(paymentRequest.APIKEY).toString('base64')
		
		res.send(paymentRequest)
	}

exports.initCheckout = function(req,res){
		var products = config.get('products')
		res.send(products)
	}


exports.methods = function(req,res){
	 var paymentRequest = config.get('testData')
     var options = {
			 url: config.get('env.host') + '/methods?country='+req.query.country,
	    	 headers: {
	        	"Authorization": "Basic " + new Buffer(paymentRequest.APIKEY).toString('base64')
	    	}
		}  	   
	console.log(options)
    request.get(options, function (error, response, body) { 
			var data = {}
			console.log(error)
			console.log(body)
			res.statusCode = response.statusCode
			res.send(body)
		
	})
}


exports.post = function(req, res){
	var message = {};
    req.on('data', function (data) {
    	
        message = JSON.parse(data);        
    	if (message.length > 1e6)
            req.connection.destroy();

    });
    req.on('end', function () { 
        //console.log(body['headers'])
		 var options = {
			 url: config.get('env.host') + '/payments',
	    	 headers: {
	        	"Authorization": "Basic " + message['headers']
	    	},
	    	body: message.body
		}  	     
		logger.info(options)
		request.post(options, function (error, response, body){
			  var data = {}
			  parsedBody = contentParse(body)
			  if (!error && response.statusCode >= 200 && response.statusCode < 300) {
			  	
			    logger.info(response.statusCode)
			    
			  }
			  else{
			  	logger.error(response.statusCode)
			  	
			  }
			  logger.info(body)
			  data.headers = response.headers
			  data.statusCode = response.statusCode
			  data.body = parsedBody
			  res.send(JSON.stringify(data))
		})

	})
}

exports.get = function(req, res){

	var renderPayments = jade.compileFile('./views/payments.jade', {pretty: true})

	logger.info('APIKEY:' + config.util.getEnv('APIKEY'))

	var options = {
		 url: config.get('env.host') + '/payments',
    	 headers: {
        	'Authorization': 'Basic '+ config.util.getEnv('APIKEY')
    	}
	}

	logger.info(options)

	request.get(options, function (error, response, body) {				  
		  
		  var parsedBody = null
		  if (!error && response.statusCode > 200 && response.code < 300) {
		  	
		    logger.info(body)
		    parsedBody = contentParse(body)
		  }
		  else{
		  	logger.error(response.statusCode)
		  	parsedBody = ''
		  }
		  
		  var info = {info: {body : parsedBody}}
		  var htmlPayments  =  renderPayments(info)
		  res.send(htmlPayments)
		
		})
}

function contentParse(content){
    content = content.replace(/\n?\r\n/g, '<br/>' ).replace(/"/g, '\'').replace(/ /g, '&nbsp;')
    return content;
}