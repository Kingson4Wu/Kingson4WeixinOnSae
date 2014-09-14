<!DOCTYPE HTML>
<html>
<HEAD>
<meta charset="utf-8">
<TITLE>部门管理</TITLE>
</HEAD>
<body>
    
<?php
include("base-class.php");

//新建sae数据库类
$mysql = new SaeMysql();

//获取当前页码
$page=intval($_GET["page"]);

//获取操作标识传入
$action=$_GET["action"];
$action= string::un_script_code($action);
$action= string::un_html($action);


//是否删除
if($action=="del")
{
    //获取部门ID号传入
    $class_id=intval($_GET["class_id"]);
    //获取当前时间
    $nowtime=date("Y/m/d H:i:s",time());
	$mysql->runSql("update class set status=0,edittime='$nowtime' where class_id=$class_id");    
    echo "<script>alert('操作成功！');location='class_manager.php?page=$page';</Script>";
    exit;    
}    
//列表数据获取、分页

//计算总数
$count=$mysql->getVar("select COUNT(*) from class where status=1");
//如果数据表里有数据
if($count)
{
    //每页显示记录数
    $page_num = 2;
    //如果无页码参数则为第一页
    if ($page == 0) $page = 1;
    //计算开始的记录序号
    $from_record = ($page - 1) * $page_num;
    //获取符合条件的数据
    $class_list=$mysql->getData("select A.class_id,A.class_name,B.class_name as fclass_name
                from class A left join class B on A.class_fid=B.class_id where A.status=1 
                order by A.class_id desc 
                limit $from_record,$page_num");
    //分页函数
    $multi = multi($count, $page_num, $page, "class_manager.php");
}
?>
    <!--页面名称-->
	<h3>部门管理<a href="class_add.php">新增部门>></a></h3>
    <!--列表开始-->
    
    <table border=1>
        <tr>
            <td>序号</td><td>部门名称</td><td>所属上级</td><td>操作</td>
        </tr>
        <?php
			if($class_list)
            {
                foreach($class_list as $value)
                {
                
                    echo "<tr>
                          <td>$value[class_id]</td>
                          <td>$value[class_name]</td>
                          <td>$value[fclass_name]</td>
                          <td>
                            <a href='class_manager.php?action=del&class_id=$value[class_id]'>删除</a>
                            <a href='class_add.php?class_id=$value[class_id]'>修改</a>
                          </td>
                          <tr>";
                }
            }
			else
            {
                echo "<tr><td colspan=4>无记录</td></tr>";
            }
        ?>
    
    </table>
    <?php
	echo $multi;
    ?>
</body>
</html>
