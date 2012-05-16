/*
 * lib_gg_orgchart 0.4 - JavaScript Organizational Chart Drawing Library
 *
 * Copyright (c) 2012 Gorka G Llona (GG) - http://www.fluxus.com.ve/gorka.
 * Licensed under the GNU Lesser General Public License.
 * Project home: http://www.fluxus.com.ve/gorka/lib_gg_orgchart.
 * 
 * Revision history:
 * v.0.4 (2012.05.14, GG): made publicly available
 */


// PARAMETERS YOU SHOULD DEFINE IN YOUR HTML FILE
// see companion html file for samples and documentation

/*
var oc_data;                                  // json organizational chart hierarchy
var oc_style;                                 // json organizational chart styles
function oc_box_click_handler (event, box);   // handler for box clicking event
*/

// END OF PARAMETERS

// PUBLIC FUNCTIONS


// call this function in order to draw the chart
// note: oc_data and oc_style will be changed in this operation
//
function oc_render () {
	oc_calc();
	oc_draw();
}


// END OF PUBLIC FUNCTIONS

// PRIVATE FUNCTIONS AND VARIABLES


// global variables
var oc_max_text_width = 0;
var oc_max_text_height = 0;
var oc_max_title_lines = 0;
var oc_max_subtitle_lines = 0;
var oc_paper = null;


// clone an object or array
// 
function oc_clone (obj) {
	var newObj = (obj instanceof Array) ? [] : {};
	for (i in obj) {
		if (obj[i] && typeof obj[i] == "object")
			newObj[i] = oc_clone(obj[i]);
		else
			newObj[i] = obj[i];
	}
	return newObj;
}


// add an offset to a (x, y) point
//
function oc_add2point (base, delta) {
	base[0] += delta[0];
	base[1] += delta[1];
}


// return a string made by repeating 'str' 'times' times
//
function oc_repeat_str (str, times) {
	var result = '';
	for (var i = 0; i < times; i++)
		result += str;
	return result;
}


// calc all orgchart metrics needed for drawing
//
function oc_calc () {
	oc_text_limit(oc_data.root);
	oc_delete_special_chars(oc_data.root);
	oc_text_dimensions(oc_data.root);
	oc_data.root.is_root = true;
	oc_boundboxes_dimensions(oc_data.root);
}


// insert newlines in titles and subtitles in order to meet max_text_width limit of each line
//
function oc_text_limit (node) {
	if (oc_style.max_text_width == 0)
		return;
	node.title = oc_text_limit_obj(node.title);
	node.subtitle = oc_text_limit_obj(node.subtitle);
	if (node.children === undefined)
		return;
	for (var i = 0; i < node.children.length; i++)
		oc_text_limit(node.children[i]);
}


// insert newlines in a string in order to meet max_text_width limit
//
function oc_text_limit_obj (str) {
	if (str == undefined)
		return undefined;
	var parts = str.split(/[ \n]+/);
	var lines = [];
	var line_str = '';
	var last_line_str = '';
	for (var i = 0; i < parts.length; i++) {
		var last_line_str = line_str;
		line_str += (i == 0 ? '' : ' ') + parts[i];
		if (line_str.length > oc_style.max_text_width) {
			lines.push(last_line_str);
			line_str = parts[i];
		}
	}
	if (line_str != '')
		lines.push(line_str);
	var result = lines.join('\n');
	return result;
}


// substitute special chars in node title and subtitle (they don't render well in SVG)
//
function oc_delete_special_chars (node) {
	node.title = oc_delete_special_chars_obj(node.title);
	node.subtitle = oc_delete_special_chars_obj(node.subtitle);
	if (node.children === undefined)
		return;
	for (var i = 0; i < node.children.length; i++)
		oc_delete_special_chars(node.children[i]);
}


// substitute special chars in a string
//
function oc_delete_special_chars_obj (str) {
	if (str === undefined)
		return undefined;
	str = str.replace(/á/g, 'a');
	str = str.replace(/é/g, 'e');
	str = str.replace(/í/g, 'i');
	str = str.replace(/ó/g, 'o');
	str = str.replace(/ú/g, 'u');
	str = str.replace(/Á/g, 'A');
	str = str.replace(/É/g, 'E');
	str = str.replace(/Í/g, 'I');
	str = str.replace(/Ó/g, 'O');
	str = str.replace(/Ú/g, 'U');
	str = str.replace(/ñ/g, 'n');
	str = str.replace(/Ñ/g, 'N');
	return str;
}


// calc text dimensions in order to calc size of boxes
// result will be stored in global variables
//
function oc_text_dimensions (node) {
	var dimensions_title    = [ 0, 0 ];
	var dimensions_subtitle = [ 0, 0 ];
	node.title_lines = node.subtitle_lines = 0;

	// check title dimensions
	dimensions_title = oc_text_dimensions_obj (node.title, oc_style.title_char_size);
	node.title_lines = dimensions_title[2];
	if (node.title_lines > oc_max_title_lines)
		oc_max_title_lines = node.title_lines;

	// check subtitle dimensions
	if (node.subtitle !== undefined) {
		dimensions_subtitle = oc_text_dimensions_obj (node.subtitle, oc_style.subtitle_char_size);
		node.subtitle_lines = dimensions_subtitle[2];
		if (node.subtitle_lines > oc_max_subtitle_lines)
			oc_max_subtitle_lines = node.subtitle_lines;
	}

	// check node dimensions vs stored dimensions
	if (dimensions_title[0] > oc_max_text_width)
		oc_max_text_width = dimensions_title[0];
	if (dimensions_subtitle[0] > oc_max_text_width)
		oc_max_text_width = dimensions_subtitle[0];
	if (dimensions_title[1] + dimensions_subtitle[1] > oc_max_text_height)
		oc_max_text_height = dimensions_title[1] + dimensions_subtitle[1];

	// traverse children
	if (node.children === undefined)
		return;
	for (var i = 0; i < node.children.length; i++)
		oc_text_dimensions(node.children[i]);
}


// calc the size (in pixels) of a multi-line string
// third element of the returned array is the number of lines of the text
//
function oc_text_dimensions_obj (text, font_pixels) {
	var width = 0;
	var parts = text.split('\n');
	if (parts.length == 0)
		return [0, 0];
	for (var i = 0; i < parts.length; i++) {
		if (parts[i].length > width)
			width = parts[i].length;
	}
	return [ width * font_pixels[0], parts.length * font_pixels[1], parts.length ];
}


// calc all metrics (of a node and subnodes) needed for drawing the chart
//
function oc_boundboxes_dimensions (node) {
	// complete attributes
	if (node.type === undefined)
		node.type = 'subordinate';
	//if (node.is_root !== undefined)
		node.deltacorner = [ 0, 0 ];

	// traverse down recursively; add position attribute to collateral and staff children
	var oc_staff_position = 0;
	var oc_collateral_position = 0;
	if (node.children !== undefined) {
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			if (child.type == 'staff')
				child.position = (oc_staff_position++ % 2 == 0 ? 'left' : 'right');
			else if (child.type == 'collateral')
				child.position = (oc_collateral_position++ % 2 == 0 ? 'left' : 'right');
			oc_boundboxes_dimensions(child);
		}
	}

	// now each children have: boundbox, deltacenter, fullbbox, deltacorner and xoffset
	// now calc this node boundbox and deltacenter
	node.boundbox = [
		oc_max_text_width  + 2 * oc_style.inner_padding,
		oc_max_text_height + 2 * oc_style.inner_padding
	];
	var y = node.boundbox[1];
	if (node.is_root !== undefined) {
		oc_add2point(node.boundbox, [
			2 * oc_style.hline,   // 0
			2 * oc_style.vline    // 0
		]);
		node.deltacenter = [ node.boundbox[0] / 2, y / 2 + 2 * oc_style.vline ];
	}
	else if (node.type == 'collateral') {
		oc_add2point(node.boundbox, [
			2 * oc_style.hline,
			2 * oc_style.vline   // 0
		]);
		node.deltacenter = [ node.boundbox[0] / 2, y / 2 + 2 * oc_style.vline ];
	}
	else if (node.type == 'staff') {
		oc_add2point(node.boundbox, [
			2 * oc_style.hline,
			1 * oc_style.vline
		]);
		node.deltacenter = [ node.boundbox[0] / 2, y / 2 + 1 * oc_style.vline ];
	}
	else {   // subordinate
		oc_add2point(node.boundbox, [
			2 * oc_style.hline,
			2 * oc_style.vline
		]);
		node.deltacenter = [ node.boundbox[0] / 2, y / 2 + 2 * oc_style.vline ];
	}

	// now prepare calc of this node fullbbox and deltacorner of children
	node.fullbbox = oc_clone(node.boundbox);
	if (node.children === undefined)
		node.xoffset = 0;
	// 1. collateral children
	var collateral_left_width  = node.boundbox[0] / 2;
	var collateral_right_width = node.boundbox[0] / 2;
	var collateral_children = 0;
	if (node.children !== undefined) {
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			if (child.type != 'collateral')
				continue;
			collateral_children++;
			if (child.position == 'left')
				collateral_left_width = child.fullbbox[0] + node.boundbox[0] / 2;
			else   // right
				collateral_right_width = child.fullbbox[0] + node.boundbox[0] / 2;
		}
	}            
	// 2. staff children
	var staff_height = 0;
	var last_left_height = 0;
	var last_right_height = 0;
	var staff_left_width = 0;
	var staff_right_width = 0;
	var staff_children = 0;
	if (node.children !== undefined) {
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			if (child.type != 'staff')
				continue;
			staff_children++;
			if (child.position == 'left') {
				staff_height += child.fullbbox[1];
				last_left_height = child.fullbbox[1];
				if (staff_left_width < child.fullbbox[0])
					staff_left_width = child.fullbbox[0];
			}
			else {   // right
				last_left_height = child.fullbbox[1];
				if (child.fullbbox[1] > last_left_height)
					staff_height += child.fullbbox[1] - last_left_height;
				if (staff_right_width < child.fullbbox[0])
					staff_right_width = child.fullbbox[0];
			}
		}
	}        
	// 3. subordinate children
	var subordinate_full_width = 0;
	if (node.children !== undefined) {
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			if (child.type != 'subordinate')
				continue;
			subordinate_full_width += child.fullbbox[0];
		}
	}

	// calc total width and xoffset of this node
	var left_width = 0;
	if (collateral_left_width      > left_width) left_width = collateral_left_width;
	if (staff_left_width           > left_width) left_width = staff_left_width;
	if (subordinate_full_width / 2 > left_width) left_width = subordinate_full_width / 2;
	var right_width = 0;
	if (collateral_right_width     > right_width) right_width = collateral_right_width;
	if (staff_right_width          > right_width) right_width = staff_right_width;
	if (subordinate_full_width / 2 > right_width) right_width = subordinate_full_width / 2;
	node.xoffset = left_width - node.boundbox[0] / 2;

	// now calc this node fullbbox, and deltacorner of children
	// 1. collateral children
	if (node.children !== undefined) {
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			if (child.type != 'collateral')
				continue;
			if (child.position == 'left') {
				child.deltacorner = [
					left_width - node.boundbox[0] / 2 - child.fullbbox[0],
					0
				];
			}
			else {   // right
				child.deltacorner = [
					left_width + node.boundbox[0] / 2,
					0
				];
			}
			oc_update_fullbbox(node, child);
		}
	}            
	// 2. staff children
	staff_height = 0;
	last_left_height = 0;
	last_right_height = 0;
	if (node.children !== undefined) {
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			if (child.type != 'staff')
				continue;
			if (child.position == 'left') {
				child.deltacorner = [
					left_width - child.fullbbox[0],
					node.boundbox[1] + staff_height
				];
				staff_height    += child.fullbbox[1];
				last_left_height = child.fullbbox[1];
				if (staff_children == 1)   // patch for case of only one children drawn at botton left of the node
					node.fullbbox[0] += node.boundbox[0] ;
			}
			else {   // right
				child.deltacorner = [
					left_width,
					node.boundbox[1] + last_right_height
				];
				last_left_height = child.fullbbox[1];
				if (child.fullbbox[1] > last_left_height)
					staff_height += child.fullbbox[1] - last_left_height;
			}
			oc_update_fullbbox(node, child);
		}
	}            
	// 3. subordinate children
	var incremental_width = 0;
	var diff_width = left_width - subordinate_full_width / 2;
	if (diff_width < 0) diff_width = 0;
	if (node.children !== undefined) {
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			if (child.type != 'subordinate')
				continue;
			child.deltacorner = [
				diff_width + incremental_width,
				node.boundbox[1] + staff_height
			];
			incremental_width += child.fullbbox[0];
		}
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			if (child.type != 'subordinate')
				continue;
			oc_update_fullbbox(node, child);
		}
	}

	if (OC_DEBUG) { 
		if (node.children !== undefined) {
			for (var i = 0; i < node.children.length; i++) {
				var child = node.children[i];
				console.log('oc_boundboxes_dimensions [' + child.title + '] ' +
					'boundbox(' + child.boundbox[0] + ',' + child.boundbox[1] + ') ' +
					'deltacenter(' + child.deltacenter[0] + ',' + child.deltacenter[1] + ') ' +
					'fullbbox(' + child.fullbbox[0] + ',' + child.fullbbox[1] + ') ' +
					'deltacorner(' + child.deltacorner[0] + ',' + child.deltacorner[1] + ') ' +
					'xoffset(' + child.xoffset + ')');
			}
		}
	}
}


// update the full bounding box of a subtree by adding the size and relative position of a child
//
function oc_update_fullbbox(node, child) {
	// entran: child.deltacorner, node.fullbbox
	var x0 = 0, y0 = 0, x1 = node.fullbbox[0], y1 = node.fullbbox[1];

	if (child.deltacorner[0] < x0)                        x0 = child.deltacorner[0];
	if (child.deltacorner[0] + child.fullbbox[0] > x1)    x1 = child.deltacorner[0] + child.fullbbox[0];
	if (child.deltacorner[1] + child.fullbbox[1] > y1)    y1 = child.deltacorner[1] + child.fullbbox[1];
	if (x0 < node.deltacorner[0])                         node.deltacorner[0] = x0;

	if (OC_DEBUG)
		console.log('updatefullbbox ' + node.title + ' <-- ' + child.title + ' x0=' + x0 + ' x1=' + x1 + ' y0=' + y0 + ' y1=' + y1);

	node.fullbbox = [ x1 - x0, y1 - y0 ];
}


// after all calcs, draw the chart into the 'oc_container' DIV
//
function oc_draw () {
	oc_paper = new Raphael(document.getElementById(oc_style.container), oc_data.root.fullbbox[0], oc_data.root.fullbbox[1]);
	oc_draw_obj(oc_data.root, null, 0, 0);
	// draw orgchart title here
}


// draw a subtree
//
function oc_draw_obj (node, parent, xoffset, yoffset) {
	// draw children
	if (node.children !== undefined) {
		for (var i = 0; i < node.children.length; i++)
			oc_draw_obj(node.children[i], node, node.deltacorner[0] + xoffset, node.deltacorner[1] + yoffset);
	}

	if (OC_DEBUG) {
		console.log('drawing ' + node.title + ': legacyXoff=' + xoffset + ' legacyYoff=' + yoffset +
			' dcornerX=' + node.deltacorner[0] + ' dcornerY=' + node.deltacorner[1] + ' dcenterX=' +
			node.deltacenter[0] +' dcenterY=' + node.deltacenter[1] + ' xoff=' + node.xoffset);
	}

	// draw this node rectangle
	var xc = xoffset + node.deltacorner[0] + node.deltacenter[0] + node.xoffset;
	var yc = yoffset + node.deltacorner[1] + node.deltacenter[1];
	var x0 = xc - oc_max_text_width  / 2 - oc_style.inner_padding;
	var x1 = xc + oc_max_text_width  / 2 + oc_style.inner_padding;
	var y0 = yc - oc_max_text_height / 2 - oc_style.inner_padding;
	var y1 = yc + oc_max_text_height / 2 + oc_style.inner_padding;
	var box = oc_paper.rect(x0, y0, x1 - x0, y1 - y0);
	box.attr('fill'  , oc_style.box_color       );
	box.attr('stroke', oc_style.box_border_color);
	if (node.id !== undefined)
		box.oc_id = node.id;

	// attach events to rectangle
	box.hover(
		function (event) { this.attr({ fill: oc_style.box_color_hover }); },
		function (event) { this.attr({ fill: oc_style.box_color       }); }
		//, overScope, outScope
	);
	if (oc_style.box_click_handler !== null)
		box.click( function (event) { oc_style.box_click_handler(event, box); } );

	// draw node title and subtitle
	var title_ypos = y0 + oc_style.inner_padding
					 + node.title_lines * oc_style.title_char_size[1] / 2
					 + (oc_max_title_lines - node.title_lines) * oc_style.title_char_size[1] / 2
					 - 2;
	var title = oc_paper.text(xc, title_ypos, node.title);
	title.attr('font-family', 'Courier');
	title.attr('font-size', oc_style.title_font_size);
	title.attr('fill', oc_style.title_color);
	if (node.subtitle !== undefined) {
		var subtitle_ypos = y1 - oc_style.inner_padding
							- node.subtitle_lines * oc_style.subtitle_char_size[1] / 2;
		var subtitle = oc_paper.text(xc, subtitle_ypos, node.subtitle);
		subtitle.attr('font-family', 'Courier');
		subtitle.attr('font-size', oc_style.subtitle_font_size);
		subtitle.attr('fill', oc_style.subtitle_color);
	}

	// draw line connectors
	if (parent != null) {
		var pxc = xc - node.xoffset - node.deltacorner[0] + parent.xoffset + (                    0 -                   0);
		var pyc = yc -            0 - node.deltacorner[1] +              0 + (parent.deltacenter[1] - node.deltacenter[1]);
		var px0 = pxc - oc_max_text_width  / 2 - oc_style.inner_padding;
		var px1 = pxc + oc_max_text_width  / 2 + oc_style.inner_padding;
		var py0 = pyc - oc_max_text_height / 2 - oc_style.inner_padding;
		var py1 = pyc + oc_max_text_height / 2 + oc_style.inner_padding;
		var line1, line2;
		if (node.type == 'collateral') {
			if (node.position == 'left') {
				var path = 'M ' + x1 + ' ' + yc + ' l ' + (2 * oc_style.hline) + ' 0';
				line1 = oc_paper.path(path);
				line2 = oc_paper.path(path);
			}
			else {   // right
				var path = 'M ' + x0 + ' ' + yc + ' l -' + (2 * oc_style.hline) + ' 0';
				line1 = oc_paper.path(path);
				line2 = oc_paper.path(path);
			}
		}
		else if (node.type == 'staff') {
			if (node.position == 'left') {
				var path = 'M ' + x1 + ' ' + yc + ' h ' + (pxc - x1) + ' v ' + (pyc - yc);
				line1 = oc_paper.path(path);
				line2 = oc_paper.path(path);
			}
			else {   // right
				var path = 'M ' + x0 + ' ' + yc + ' h ' + (pxc - x0) + ' v ' + (pyc - yc);
				line1 = oc_paper.path(path);
				line2 = oc_paper.path(path);
			}
		}
		else {   // subordinate
			if (node.is_root === undefined) {
				var path = 'M ' + xc + ' ' + y0 + ' v -' + oc_style.vline + ' h ' + (pxc - xc) + ' V ' + py1;
				line1 = oc_paper.path(path);
				line2 = oc_paper.path(path);
			}
		}
		line1.attr('stroke', oc_style.line_color);
		line2.attr('stroke', oc_style.line_color);
	}

	if (OC_DEBUG) {
		// draw the boundbox
		x0 = xoffset + node.deltacorner[0] + node.xoffset;
		x1 = xoffset + node.deltacorner[0] + node.xoffset + node.boundbox[0];
		y0 = yoffset + node.deltacorner[1];
		y1 = yoffset + node.deltacorner[1] + node.boundbox[1];
		var boundbox = oc_paper.rect(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 6);
		boundbox.attr({
			stroke : "#00f", 
			"stroke-width" : 0.4
		});
		// draw the fullbbox
		x0 = xoffset + node.deltacorner[0];
		x1 = xoffset + node.deltacorner[0] + node.fullbbox[0];
		y0 = yoffset + node.deltacorner[1];
		y1 = yoffset + node.deltacorner[1] + node.fullbbox[1];
		var fullbbox = oc_paper.rect(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 2);
		fullbbox.attr({
			stroke : "#f00", 
			"stroke-width" : 0.4
		});
	}

}

// END OF LIBRARY
