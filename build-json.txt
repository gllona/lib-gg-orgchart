<?php



define('ORGCHART_SERVER',   'localhost');
define('ORGCHART_DATABASE', 'u800544907_chart');       // CUSTOMIZE
define('ORGCHART_USER',     'u800544907_chart');       // CUSTOMIZE
define('ORGCHART_PASSWORD', 'gllona_dbpassword_14');   // CUSTOMIZE
define('ORGCHART_TABLE',    'orgchart_box');



$ocId    = isset($_REQUEST['ocId'])    ? $_REQUEST['ocId']    : 1;
$ocTitle = isset($_REQUEST['ocTitle']) ? $_REQUEST['ocTitle'] : 'OrgChart';



function getRows ()
{
    if (! ($dbConn = @mysqli_connect(ORGCHART_SERVER, ORGCHART_USER, ORGCHART_PASSWORD, ORGCHART_DATABASE))) {
        return null;
    }
    $table = ORGCHART_TABLE;
    $sql   = <<<END
        SELECT `id`, `title`, `subtitle`, `parent_id`, `type`
          FROM `$table`
         ORDER BY `order`, `id`;
END;
    if (($rs = mysqli_query($dbConn, $sql)) === false) {
        return null;
    }
    $rows = array();
    while ($row = $rs->fetch_assoc()) {
        $rows[] = $row;
    }
    return $rows;
}



function makeNode ($id, $title, $subtitle = null, $type = null)
{
    $node = array(
        "id"    => "$id",
        "title" => "$title",
    );
    if ($subtitle !== null) {
        $node["subtitle"] = "$subtitle";
    }
    if ($type !== null) {
        $node["type"] = "$type";
    }
    return $node;
}



function& findNode (&$subtree, $id)
{
    $null = null;
    if ($subtree['id'] == $id) {
        return $subtree;
    }
    if (! isset($subtree['children'])) {
        return $null;
    }
    foreach ($subtree['children'] as &$child) {
        $found =& findNode($child, $id);
        if ($found !== null) {
            return $found;
        }
    }
    return $null;
}



function addChild (&$parent, &$node)
{
    if (! isset($parent['children'])) {
        $parent['children'] = array();
    }
    $parent['children'][] = $node;   // should be "... =& $node;" but it's failing because of recursion in tree (debug please!)
}



function buildTree ()
{
    if (($rows = getRows()) === null) {
        return null;
    }
    $tree     = array();   // the tree
    $inserted = array();   // all nodes inserted in $tree, indexed by 'id'
    do {
        $changed = false;
        foreach ($rows as $row) {
            $id = $row['id'];
            if (isset($inserted[$id])) {
                continue;
            }
            if (($parentId = $row['parent_id']) === null) {
                $tree          =  makeNode($id, $row['title'], $row['subtitle']);
                $inserted[$id] =& $tree;
                $changed       =  true;
                continue;
            }
            // if (! isset($inserted[$parentId])) { continue; } else { $parent =& $inserted[$parentId]; }   // not working because of addChild() problem
            if (($parent =& findNode($tree, $parentId)) === null) {                                         // working; less efficient
                continue;
            }
            $node = makeNode($id, $row['title'], $row['subtitle'], $row['type']);
            addChild($parent, $node);
            $inserted[$id] =& $node;
            $changed       =  true;
        }
    }
    while ($changed);
    return $tree;
}



function wrapTree ($boxes, $ocId, $ocTitle)
{
    return array(
        "id"    => "$ocId",
        "title" => "$ocTitle",
        "root"  => $boxes,
    );
}



if (($tree = buildTree()) === null) {
    $tree = makeNode(1, "Error building JSON");
}
$orgchart = wrapTree($tree, $ocId, $ocTitle);

header('Content-Type: application/json');
// echo json_encode($orgchart, JSON_PRETTY_PRINT);
echo json_encode($orgchart);
