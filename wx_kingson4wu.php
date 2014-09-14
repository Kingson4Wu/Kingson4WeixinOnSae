<?php

// 用于验证
/*
 * //define your token define("TOKEN", "123456"); $wechatObj = new wechatCallbackapiTest(); $wechatObj->valid(); class wechatCallbackapiTest { public function valid() { $echoStr = $_GET["echostr"]; //valid signature , option if($this->checkSignature()){ echo $echoStr; exit; } } public function responseMsg() { //get post data, May be due to the different environments $postStr = $GLOBALS["HTTP_RAW_POST_DATA"]; //extract post data if (!empty($postStr)){ $postObj = simplexml_load_string($postStr, 'SimpleXMLElement', LIBXML_NOCDATA); $fromUsername = $postObj->FromUserName; $toUsername = $postObj->ToUserName; $keyword = trim($postObj->Content); $time = time(); $textTpl = "<xml> <ToUserName><![CDATA[%s]]></ToUserName> <FromUserName><![CDATA[%s]]></FromUserName> <CreateTime>%s</CreateTime> <MsgType><![CDATA[%s]]></MsgType> <Content><![CDATA[%s]]></Content> <FuncFlag>0</FuncFlag> </xml>"; if(!empty( $keyword )) { $msgType = "text"; $contentStr = "Welcome to wechat world!"; $resultStr = sprintf($textTpl, $fromUsername, $toUsername, $time, $msgType, $contentStr); echo $resultStr; }else{ echo "Input something..."; } }else { echo ""; exit; } } private function checkSignature() { $signature = $_GET["signature"]; $timestamp = $_GET["timestamp"]; $nonce = $_GET["nonce"]; $token = TOKEN; $tmpArr = array($token, $timestamp, $nonce); sort($tmpArr, SORT_STRING); $tmpStr = implode( $tmpArr ); $tmpStr = sha1( $tmpStr ); if( $tmpStr == $signature ){ return true; }else{ return false; } } }
 */
// 装载模板文件
include_once ("wx_tpl.php");

// 获取微信发送数据
$postStr = $GLOBALS ["HTTP_RAW_POST_DATA"];

// 返回回复数据
if (! empty ( $postStr )) {
	
	// 解析数据
	$postObj = simplexml_load_string ( $postStr, 'SimpleXMLElement', LIBXML_NOCDATA );
	// 发送消息方ID
	$fromUsername = $postObj->FromUserName;
	// 接收消息方ID
	$toUsername = $postObj->ToUserName;
	// 消息类型
	$form_MsgType = $postObj->MsgType;
	
	// 图片消息
	if ($form_MsgType == "image") {
		// 获取发送图片的URL
		$form_PicUrl = $postObj->PicUrl;
		// 创建新图片的名称
		$filename = $fromUsername . date ( "YmdHis" ) . ".jpg";
		// 建立抓取图片类
		$f = new SaeFetchurl ();
		// 抓取图片
		$res = $f->fetch ( $form_PicUrl );
		// 如果抓取到图片
		if ($f->errno () == 0) {
			// 新建存储类
			$s = new SaeStorage ();
			$s->write ( "kingson4wu", $filename, $res );
			
			if ($s->errno () == 0) {
				$msgType = "text";
				
				$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, time (), $msgType, "Upload Success!" );
				echo $resultStr;
			} else {
				$msgType = "text";
				
				$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, time (), $msgType, "Save failed!" );
				echo $resultStr;
			}
		} else {
			$msgType = "text";
			
			$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, time (), $msgType, "Upload failed!" );
			echo $resultStr;
		}
		exit ();
	}
	
	// 地理位置,本地天气
	if ($form_MsgType == "location") {
		// 获取地理消息信息，经纬度，地图缩放比例，地址
		$from_Location_X = $postObj->Location_X;
		$from_Location_Y = $postObj->Location_Y;
		$from_Location_Scale = $postObj->Scale;
		$from_Location_Label = $postObj->Label;
		// 地址解析使用百度地图API的链接
		$map_api_url = "http://api.map.baidu.com/geocoder?";
		// 坐标类型
		$map_coord_type = "&coord_type=wgs84";
		// 建立抓取对象
		$f = new SaeFetchurl ();
		// 抓取百度地址解析
		$geocoder = $f->fetch ( $map_api_url . $map_coord_type . "&location=" . $from_Location_X . "," . $from_Location_Y );
		// 如果抓取地址解析成功
		if ($f->errno () == 0) {
			// 匹配出城市
			preg_match_all ( "/\<city\>(.*?)\<\/city\>/", $geocoder, $city );
			$city = str_replace ( array (
					"市",
					"县",
					"区" 
			), array (
					"",
					"",
					"" 
			), $city [1] [0] );
			// 通过新浪天气接口查询天气的链接
			$weather_api_url = "http://php.weather.sina.com.cn/xml.php?password=DJOYnieT8234jlsK";
			// 城市名转字符编码
			$city = "&city=" . urlencode ( iconv ( "UTF-8", "GBK", $city ) );
			// 查询当天
			$day = "&day=0";
			// 抓取天气
			$weather = $f->fetch ( $weather_api_url . $city . $day );
			// 如果抓取到天气
			if ($f->errno () == 0 && strstr ( $weather, "Weather" )) {
				// 用正则表达式获取数据
				preg_match_all ( "/\<city\>(.*?)\<\/city\>/", $weather, $w_city );
				preg_match_all ( "/\<status2\>(.*?)\<\/status2\>/", $weather, $w_status2 );
				preg_match_all ( "/\<status1\>(.*?)\<\/status1\>/", $weather, $w_status1 );
				preg_match_all ( "/\<temperature2\>(.*?)\<\/temperature2\>/", $weather, $w_temperature2 );
				preg_match_all ( "/\<temperature1\>(.*?)\<\/temperature1\>/", $weather, $w_temperature1 );
				preg_match_all ( "/\<direction2\>(.*?)\<\/direction2\>/", $weather, $w_direction2 );
				preg_match_all ( "/\<power2\>(.*?)\<\/power2\>/", $weather, $w_power2 );
				preg_match_all ( "/\<chy_shuoming\>(.*?)\<\/chy_shuoming\>/", $weather, $w_chy_shuoming );
				preg_match_all ( "/\<savedate_weather\>(.*?)\<\/savedate_weather\>/", $weather, $w_savedate_weather );
				// 如果天气变化一致
				if ($w_status2 == $w_status1) {
					$w_status = $w_status2 [1] [0];
				} else {
					$w_status = $w_status2 [1] [0] . "转" . $w_status1 [1] [0];
				}
				// 将获取到的数据拼接起来
				$weather_res = array (
						$w_city [1] [0] . "天气预报",
						"发布：" . $w_savedate_weather [1] [0],
						"气候：" . $w_status,
						"气温：" . $w_temperature2 [1] [0] . "-" . $w_temperature1 [1] [0],
						"风向：" . $w_direction2 [1] [0],
						"风力：" . $w_power2 [1] [0],
						"穿衣：" . $w_chy_shuoming [1] [0] 
				);
				$weather_res = implode ( "\n", $weather_res );
				
				$msgType = "text";
				$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, $time, $msgType, $weather_res );
				echo $resultStr;
			} else {
				// 失败提示
				$msgType = "text";
				$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, $time, $msgType, "天气获取失败" );
				echo $resultStr;
			}
		} else {
			// 失败提示
			$msgType = "text";
			$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, $time, $msgType, "无法获取地理位置" );
			echo $resultStr;
		}
		exit ();
	}
	
	// 文字消息
	if ($form_MsgType == "text") {
		// 获取用户发送的文字内容
		$form_Content = trim ( $postObj->Content );
		
		if ($form_Content == "切尔西") {
			$return_str = "Chelsea Players:\n";
			$return_arr = array (
					"Terry 26\n",
					"Torres 9\n",
					"Oscar 11\n",
					"Ba 19\n",
					"Lampard 8\n" 
			);
			$return_str .= implode ( "", $return_arr );
			// implode函数将$return_arr转化成字符串，然后加到之前赋值过的$return_str后面
			$msgType = "text";
			
			$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, time (), $msgType, $return_str );
			echo $resultStr;
			exit ();
		}
		
		if ($form_Content == "逗比") {
			$resultStr = "<xml>\n
           <ToUserName><![CDATA[" . $fromUsername . "]]></ToUserName>\n
           <FromUserName><![CDATA[" . $toUsername . "]]></FromUserName>\n
           <CreateTime>" . time () . "</CreateTime>\n
           <MsgType><![CDATA[news]]></MsgType>\n
           <ArticleCount>2</ArticleCount>\n
           <Articles>\n";
			
			$resultStr .= "<item>\n
           <Title><![CDATA[点进去有惊喜]]></Title> \n
           <Description><![CDATA[人生赢家]]></Description>\n
           <PicUrl><![CDATA[http://kingson4wu-kingson4wu.stor.sinaapp.com/pic/life%20winner.jpg]]></PicUrl>\n
           <Url><![CDATA[http://kingson4wu.sinaapp.com/KingsonTemplate/]]></Url>\n
           </item>\n";
			
			$resultStr .= "<item>\n
           <Title><![CDATA[我的博客]]></Title> \n
           <Description><![CDATA[]]></Description>\n
           <PicUrl><![CDATA[http://kingson4wu-kingson4wu.stor.sinaapp.com/pic/1_kingson_wu.jpg]]></PicUrl>\n
           <Url><![CDATA[http://blog.csdn.net/kingson_wu]]></Url>\n
           </item>\n";
			
			$resultStr .= "</Articles>\n
           
           </xml> ";
			
			echo $resultStr;
			exit ();
		}
		
		if ($form_Content == "song") {
			
			$msgType = "music";
			
			$resultStr = sprintf ( $musicTpl, $fromUsername, $toUsername, time (), $msgType, 

			"I Do", "WestLife", "http://kingson4wu-kingson4wu.stor.sinaapp.com/pic/I-Do.mp3", "http://kingson4wu-kingson4wu.stor.sinaapp.com/pic/I-Do.mp3" );
			echo $resultStr;
			exit ();
		} 

		else if (! empty ( $form_Content )) {
			$msgType = "text";
			
			$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, time (), $msgType, $form_Content );
			echo $resultStr;
			exit ();
		} else {
			$msgType = "text";
			
			$resultStr = sprintf ( $textTpl, $fromUsername, $toUsername, time (), $msgType, "please say something ..." );
			echo $resultStr;
			exit ();
		}
	}
	
	// 事件消息
	if ($form_MsgType == "event") {
		// 获取事件类型
		$form_Event = $postObj->Event;
		// 订阅事件
		if ($form_Event == "subscribe") {
			// 回复欢迎文字消息
			/*
			 * $msgType = "text"; $contentStr = "感谢您关注我的个人公众平台！[愉快]\n\n我是Kingson[玫瑰]"; $resultStr = sprintf($textTpl, $fromUsername, $toUsername, time(), $msgType, $contentStr);
			 */
			
			$resultStr = "<xml>\n
           <ToUserName><![CDATA[" . $fromUsername . "]]></ToUserName>\n
           <FromUserName><![CDATA[" . $toUsername . "]]></FromUserName>\n
           <CreateTime>" . time () . "</CreateTime>\n
           <MsgType><![CDATA[news]]></MsgType>\n
           <ArticleCount>2</ArticleCount>\n
           <Articles>\n";
			
			$resultStr .= "<item>\n
           <Title><![CDATA[人生赢家]]></Title> \n
           <Description><![CDATA[费尔南多托雷斯]]></Description>\n
           <PicUrl><![CDATA[http://kingson4wu-kingson4wu.stor.sinaapp.com/pic/life%20winner.jpg]]></PicUrl>\n
           <Url><![CDATA[http://www.csdn.net/]]></Url>\n
           </item>\n";
			
			$resultStr .= "<item>\n
           <Title><![CDATA[我的博客]]></Title> \n
           <Description><![CDATA[]]></Description>\n
           <PicUrl><![CDATA[http://kingson4wu-kingson4wu.stor.sinaapp.com/pic/1_kingson_wu.jpg]]></PicUrl>\n
           <Url><![CDATA[http://blog.csdn.net/kingson_wu]]></Url>\n
           </item>\n";
			
			$resultStr .= "</Articles>\n
           
           </xml> ";
			
			echo $resultStr;
			exit ();
		}
	}
} else {
	echo "";
	exit ();
}

?>