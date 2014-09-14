<!DOCTYPE HTML>
<html>
<HEAD>
<meta charset="utf-8">
<TITLE>部门添加/修改</TITLE>
</HEAD>
<body>
    
<?php
include("base-class.php");

//新建sae数据库类
$mysql = new SaeMysql();

//获取部门ID号传入
$class_id=intval($_GET["class_id"]);

//获取操作标识传入
$action=$_POST["action"];
$action= string::un_script_code($action);
$action= string::un_html($action);

//判断是否修改，如果传入了部门ID，进行数据库查询获取全部内容
if($class_id)
{
	$class_value=$mysql->getLine("select * from class where class_id=$class_id");
    if(!$class_value)
	{
		echo "<script>alert('无此部门');history.back();</Script>";
		exit;
	}
}

//如果获取到操作标识，进行录入或者修改操作
if($action=="update")
{
    //获取表单传入数据
	$old_class_id=$_POST["class_id"];
	$class_name=$_POST["class_name"];
	$class_fid=$_POST["class_fid"];
    //传入数据过滤
    $old_class_id=intval($old_class_id);
    $class_name= string::un_script_code($class_name);
    $class_fid= intval($class_fid);
    //默认参数
    $nowtime=date("Y/m/d H:i:s",time());
    //如果是修改
    if($old_class_id)
    {
        //修改部门名称、所属、更新时间
  		$sql = "update class set class_name='$class_name',class_fid='$class_fid',edittime='$nowtime'
        where class_id=$old_class_id";
 		$mysql->runSql( $sql );
    }
    else
    {
        //新增
   		$sql = "insert into class (class_name,class_fid,addtime,edittime,status) values ('$class_name',
        '$class_fid','$nowtime','$nowtime',1)";
 		$mysql->runSql( $sql );
   	
    }
    if( $mysql->errno() != 0 )
    {
        echo "<script>alert('".$mysql->errmsg() ."');history.back();</Script>";
        exit;
    }
    else
    {
        echo "<script>alert('操作成功！');location='class_add.php?class_id=$old_class_id';</Script>";
        exit;    
    }
    
}    

$class_list=$mysql->getData("select class_name,class_id from class where status=1 order by class_fid asc");

?>
    <!--页面名称-->
	<h3>部门添加/修改<a href="class_manager.php">返回>></a></h3>
    <!--表单开始-->
    <form action="?" method="post" name="class_add" id="class_add" enctype="multipart/form-data">
        <p>
            部门名称：<input type="text" value="<?php echo $class_value["class_name"];?>" name="class_name">
        </p>
        <p>
            上级部门：
            <select name="class_fid">
                <option value="0">无上级部门</option>
                <?php
    				//把所有部门列表出来
                    foreach($class_list as $value)
                    {
                        $class_select=($class_value["class_fid"]==$value["class_id"])?" selected":"";
                        echo "<option value=\"$value[class_id]\" $class_select>$value[class_name]</option>";
                    }
                ?>
            </select>
        </p>
         <p>
             <!--隐藏参数，用来放置操作标示和修改的ID-->
            <input type="hidden" name="action"  value="update">
            <input type="hidden" name="class_id" value="<?=$class_value["class_id"]?>">
             <!--表单提交-->
            <input type="submit" value="提交" />
        </p>
    </form>
</body>
</html>
