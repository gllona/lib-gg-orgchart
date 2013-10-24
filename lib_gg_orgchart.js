/*
* lib_gg_orgchart 0.4 - JavaScript Organizational Chart Drawing Library
*
* Copyright (c) 2012 Gorka G Llona - http://desarrolladores.logicos.org/gorka.
* Licensed under the GNU Lesser General Public License.
* Project home: http://librerias.logicas.org/lib_gg_orgchart.
* 
* Revision history:
* v.0.4.0        (2012.05.14, GG): made publicly available
* v.0.4.1 beta 1 (2012.07.11, GG): added support for images within boxes
* v.0.4.1 beta 2 (2012.08.20, YL): fixed rendering issues with IE8
* v.0.4.1 beta 3 (2012.12.15, MJ): fixed "more than 3 staff" issue
* v.0.4.1 beta 4 (2013.01.01, MJ): added new options box_border_radius, box_border_width, box_fix_width and box_fix_height
* v.0.4.1 beta 5 (2013.01.05, MJ): fixed rendering issues with IE8 (oc_IE thing)
* v.0.4.2 beta 1 (2013.01.09, MJ): encapsulation, performance improvements
* v.0.4.2 beta 2 (2013.01.10, MJ): added staffleft and stafftop
* v.0.4.2 beta 3 (2013.01.11, MJ): added "html templates feature"; depends on jsrender and jQuery libraries, you are not forced to use it and distribute these libraries with ggOrgChart
* v.0.4.2 beta 4 (2013.01.11, MJ): avoided of using oc_max_text_height in oc_draw_obj()
* v.0.4.2 beta 5 (2013.01.16, MJ): added new options box_root_node_width and box_root_node_height
* v.0.4.2 beta 6 (2013.01.16, MJ): changed rendering of staff (to have all nodes on the same line)
* v.0.4.3 beta 1 (2013.05.22, GG): integrated patches from some users, fix rendering issues, and released minor version
* v.0.4.3 beta 2 (2013.06.12, GG): implemented "invisible" nodes for greater flexibility
* v.0.4.3 beta 2 (2013.06.12, GG): allowed drawing the text inside boxes above or below images
* v.0.4.3 beta 3 (2013.08.28, RK): fixed regression: rendering issues in IE 7 and 8
* v.0.4.3 beta 4 (2013.09.25, GG): fixed issues rendering nodes with both images and subtitles
* v.0.4.3 beta 5 (2013.10.09, OM): fixed over 60 issues reported by jshint and added bower.json
*
* Contributors (in order of appearance):
* GG :: Gorka G LLONA
* YL :: Yoann LECUYER
* MJ :: Milan JAROS
* RB :: Rob BOERMAN
* JB :: Jean-Paul BEHRNES
* RK :: Ryad BEN-EL-KEZADRI
* OM :: Ondrej Machulda (OndraM@github)
*/



( function (window, undefined) {
    // Daclaration of variables in local scope for better performance
    var document = window.document;
    var data,             // json organizational chart hierarchy
        options,          // json organizational chart options
        defaultOptions;   // json organizational chart default options
    var oc_max_text_width,
        oc_max_text_height,
        oc_max_title_lines,
        oc_max_subtitle_lines,
        oc_paper;



    // "PUBLIC" FUNCTIONS

    window.ggOrgChart = {

        // call this function in order to draw the chart
        render: function (aData, aOptions) {
            oc_init(aData, aOptions);
            oc_calc();
            oc_draw();
        },

        // define default options
        defaultOptions: {
            container: 'oc_container',         // name of the DIV where the chart will be drawn
            vline: 10,                         // size of the smallest vertical line of connectors
            hline: 10,                         // size of the smallest horizontal line of connectors
            xoffset: 0,                        // inital x-offset of diagram (can be negative)
            yoffset: 0,                        // inital y-offset of diagram (can be negative)
            inner_padding: 10,                 // space from text to box border
            box_color: '#D9EDF7',              // fill color of boxes
            box_color_hover: '#E9FDF7',        // fill color of boxes when mouse is over them
            box_border_color: '#BCE8F1',       // stroke color of boxes
            box_border_radius: 8,              // border radius of boxes in pixels
            box_border_width: 2,               // border with of boxes in pixels
            box_fix_width: null,               // set fix width for boxes in pixels
            box_fix_height: null,              // set fix height for boxes in pixels
            box_root_node_width: null,         // override fix width and max text width
            box_root_node_height: null,        // override fix height and size defined by text length
            box_html_template: null,           // id of element with template; Depends on jsrender and jQuery libraries!
            line_color: '#3A87AD',             // color of connectors
            title_color: '#3A87AD',            // color of titles
            subtitle_color: '#1A678D',         // color of subtitles
            title_font_size: 12,               // size of font used for displaying titles inside boxes
            subtitle_font_size: 10,            // size of font used for displaying subtitles inside boxes
            title_char_size: [6, 12],          // size (x, y) of a char of the font used for displaying titles
            subtitle_char_size: [5, 10],       // size (x, y) of a char of the font used for displaying subtitles
            max_text_width: 15,                // max width (in chars) of each line of text ('0' for no limit)
            text_font: 'Courier',              // font family to use (should be monospaced)
            use_images: false,                  // use images within boxes?
            images_base_url: './images/',      // base url of the images to be embeeded in boxes, with a trailing slash
            images_size: [160, 160],           // size (x, y) of the images to be embeeded in boxes
            box_click_handler: undefined,      // handler (function) called on click on boxes (set to null if no handler)
            debug: false                       // set to true if you want to debug the library
        }
    };

    // END OF "PUBLIC" FUNCTIONS



    // "PRIVATE" FUNCTIONS AND VARIABLES

    // clone an object or array
    // 
    function oc_clone(obj) {
        var newObj = (obj instanceof Array) ? [] : {};
        for (var i in obj) {
            if (obj[i] && typeof obj[i] == "object")
                newObj[i] = oc_clone(obj[i]);
            else
                newObj[i] = obj[i];
        }
        return newObj;
    }

    // overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
    //
    function oc_mergeOptions(obj1, obj2) {
        var obj3 = {};
        var attr;
        for (attr in obj1)
            obj3[attr] = obj1[attr];
        for (attr in obj2)
            obj3[attr] = obj2[attr];
        return obj3;
    }

    // add an offset to a (x, y) point
    //
    function oc_add2point(base, delta) {
        base[0] += delta[0];
        base[1] += delta[1];
    }

    // return a string made by repeating 'str' 'times' times
    //
    function oc_repeat_str(str, times) {
        var result = '';
        for (var i = 0; i < times - 1; i++)
            result += str;
        return result;
    }

    // initialization of basic variables and objects
    //
    function oc_init(aData, aOptions) {
        if (aData === undefined || aData === null) {
            console.log('ggOrgChart: data are not defined');
            return;
        }
        data = aData;
        // set defined options and it's values over default options
        defaultOptions = ggOrgChart.defaultOptions;
        options = oc_mergeOptions(defaultOptions, aOptions);

        // clear values of ggOrgChart object
        oc_max_text_width = 0;
        oc_max_text_height = 0;
        oc_max_title_lines = 0;
        oc_max_subtitle_lines = 0;
        oc_paper = null;

        // verify libraries if needed
        if (typeof options.box_html_template == "string") {
            if (window.jQuery === undefined)
                console.log("jQuery is not loaded properly");
            else {
                var j = jQuery("<div></div>");
                if (typeof j.render != "function")
                    console.log("jsrender.js is not loaded properly");
            }
        }
    }

    // calc all orgchart metrics needed for drawing
    //
    function oc_calc() {
        oc_text_limit(data.root);
        oc_delete_special_chars(data.root);
        oc_text_dimensions(data.root);
        data.root.is_root = true;
        oc_boundboxes_dimensions(data.root);
    }

    // insert newlines in titles and subtitles in order to meet max_text_width limit of each line
    //
    function oc_text_limit(node) {
        // IE fix. It is used instead of oc_IE - 18 times...
        if (node === null)
            return;
        if (options.max_text_width === 0)
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
    function oc_text_limit_obj(str) {
        if (str === undefined)
            return undefined;
        var parts = (str + '').split(/[ \n]+/);
        var lines = [];
        var line_str = '';
        var last_line_str = '';
        for (var i = 0; i < parts.length - (0); i++) {
            last_line_str = line_str;
            line_str += (i === 0 ? '' : ' ') + parts[i];
            if (line_str.length > options.max_text_width) {
                lines.push(last_line_str);
                line_str = parts[i];
            }
        }
        if (line_str !== '')
            lines.push(line_str);
        var result = lines.join('\n');
        return result;
    }

    // substitute special chars in node title and subtitle (they don't render well in SVG)
    //
    function oc_delete_special_chars(node) {
        if (node === null)
            return;
        node.title = oc_delete_special_chars_obj(node.title);
        node.subtitle = oc_delete_special_chars_obj(node.subtitle);
        if (node.children === undefined)
            return;
        for (var i = 0; i < node.children.length; i++)
            oc_delete_special_chars(node.children[i]);
    }

    // substitute special chars in a string
    //
    function oc_delete_special_chars_obj(str) {
        if (str === null || str === undefined)
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
    function oc_text_dimensions(node) {
        if (node === null)
            return;
        var dimensions_title = [0, 0];
        var dimensions_subtitle = [0, 0];
        node.title_lines = node.subtitle_lines = 0;

        // check title dimensions
        dimensions_title = oc_text_dimensions_obj(node.title, options.title_char_size);
        node.title_lines = dimensions_title[2];
        if (node.title_lines > oc_max_title_lines)
            oc_max_title_lines = node.title_lines;

        // check subtitle dimensions
        if (node.subtitle !== undefined) {
            dimensions_subtitle = oc_text_dimensions_obj(node.subtitle, options.subtitle_char_size);
            node.subtitle_lines = dimensions_subtitle[2];
            if (node.subtitle_lines > oc_max_subtitle_lines)
                oc_max_subtitle_lines = node.subtitle_lines;
        }

        // check node dimensions vs stored dimensions
        if (options.box_fix_width) {
            oc_max_text_width = options.box_fix_width - 2 * options.inner_padding;
        } else {
            if (dimensions_title[0] > oc_max_text_width)
                oc_max_text_width = dimensions_title[0];
            if (options.use_images && options.images_size[0] > oc_max_text_width)   // GG 110712 include space for optional image width
                oc_max_text_width = options.images_size[0];
            if (dimensions_subtitle[0] > oc_max_text_width)
                oc_max_text_width = dimensions_subtitle[0];
        }
        if (options.box_fix_height) {
            oc_max_text_height = options.box_fix_height - 2 * options.inner_padding;
        } else {
            if (dimensions_title[1] + dimensions_subtitle[1] > oc_max_text_height)
                oc_max_text_height = dimensions_title[1] + dimensions_subtitle[1];
        }

        // traverse children
        if (node.children === undefined)
            return;
        for (var i = 0; i < node.children.length; i++) {
            // Just a thought, will this be needed?
            // node.children[i].parent = node;
            oc_text_dimensions(node.children[i]);
        }

        // make horizantal dimensions an even number in order that divided by 2 doesn't have decimals
        if (oc_max_text_width % 2 == 1)
            oc_max_text_width++;
    }

    // calc the size (in pixels) of a multi-line string
    // third element of the returned array is the number of lines of the text
    //
    function oc_text_dimensions_obj(text, font_pixels) {
        var width = 0;
        var parts = (text + "").split('\n');
        if (parts.length === 0)
            return [0, 0];
        for (var i = 0; i < parts.length - (0); i++) {
            if (parts[i].length > width)
                width = parts[i].length;
        }
        return [width * font_pixels[0], (parts.length - (0)) * font_pixels[1], parts.length - (0)];
    }

    // calc all metrics (of a node and subnodes) needed for drawing the chart
    //
    function oc_boundboxes_dimensions(node) {
        if (node === null)
            return;

        var child, i;

        // complete attributes
        // if (node.is_root !== undefined)
        if (node.deltacorner === undefined)
            node.deltacorner = [0, 0];
        node.xoffset2 = 0;

        // traverse down recursively; add position attribute to collateral and staff children
        var oc_staff_position      = 0;
        var oc_collateral_position = 0;
        var oc_staff_counter       = 0;
        var oc_collateral_counter  = 0;
        var oc_subordinate_counter = 0;

        // invoke recursively,
        // but previously calc the indexes of children according with their role, reflecting the max in the node
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                child.parent = node;
                if (child.type == 'staff') {
                    child.indexAsStaffChildren = node.maxStaffChildIndex = ++oc_staff_counter;
                    child.position = (oc_staff_position++ % 2 === 0 ? 'left' : 'right');
                }
                else if (child.type == 'collateral') {
                    child.indexAsCollateralChildren = node.maxCollateralChildIndex = ++oc_collateral_counter;
                    child.position = (oc_collateral_position++ % 2 === 0 ? 'left' : 'right');
                }
                else if (child.type === undefined || child.type == 'subordinate') {
                    child.indexAsSubordinateChildren = node.maxSubordinateChildIndex = ++oc_subordinate_counter;
                }
                oc_boundboxes_dimensions(child);
            }
        }
        //
        // now each child have: parent, indexes, boundbox, deltacenter, fullbbox, deltacorner and xoffset

        // now calc this node boundbox and deltacenter
        node.boundbox = [
            oc_max_text_width  + 2 * options.inner_padding,
            oc_max_text_height + 2 * options.inner_padding
        ];
        if (node.is_root) {
            if (options.box_root_node_width)
                node.boundbox[0] = options.box_root_node_width;
            if (options.box_root_node_height)
                node.boundbox[1] = options.box_root_node_height;
        }

        // add vertical space for images within boxes
        if (options.use_images && node.image !== undefined)
            node.boundbox[1] += options.inner_padding * 1 + options.images_size[1];

        var y = node.boundbox[1];
        if (node.is_root !== undefined) {
            oc_add2point(node.boundbox, [
                2 * options.hline, // 0
                2 * options.vline  // 0
            ]);
            node.deltacenter = [node.boundbox[0] / 2, y / 2 + 2 * options.vline];
        } else if (node.type == 'collateral') {
            oc_add2point(node.boundbox, [
                2 * options.hline,
                2 * options.vline  // 0
            ]);
            node.deltacenter = [node.boundbox[0] / 2, y / 2 + 2 * options.vline];
        } else if (node.type == 'staff') {
            oc_add2point(node.boundbox, [
                2 * options.hline,
                2 * options.vline
            ]);
            node.deltacenter = [node.boundbox[0] / 2, y / 2 + 2 * options.vline];
        } else if (node.type == 'stafftop') {
            oc_add2point(node.boundbox, [
                2 * options.hline,
                2 * options.vline
            ]);
            node.deltacenter = [node.boundbox[0] / 2, y / 2 + 2 * options.vline];
        } else if (node.type == 'staffleft') {
            oc_add2point(node.boundbox, [
                2 * options.hline,
                2 * options.vline
            ]);
            node.deltacenter = [node.boundbox[0] / 2, y / 2 + 2 * options.vline];
        } else {
            node.type = 'subordinate';
            oc_add2point(node.boundbox, [
                2 * options.hline,
                2 * options.vline
            ]);
            node.deltacenter = [node.boundbox[0] / 2, y / 2 + 2 * options.vline];
        }

        // now prepare calc of this node fullbbox and deltacorner of children
        node.hasOnlyStaffs = true;
        node.fullbbox = oc_clone(node.boundbox);
        if (node.children === undefined)
            node.xoffset = 0;
        // 1. collateral children
        var collateral_left_width = node.boundbox[0] / 2;
        var collateral_right_width = node.boundbox[0] / 2;
        var collateral_children = 0;
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'collateral')
                    continue;
                node.hasOnlyStaffs = false;
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
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'staff')
                    continue;
                staff_children++;
                if (child.position == 'left') {
                    staff_height += child.fullbbox[1];
                    last_left_height = child.fullbbox[1];
                    if (staff_left_width < child.fullbbox[0])
                        staff_left_width = child.fullbbox[0];
                } else { // right
                    last_left_height = child.fullbbox[1];
                    if (child.fullbbox[1] > last_left_height)
                        staff_height += child.fullbbox[1] - last_left_height;
                    if (staff_right_width < child.fullbbox[0])
                        staff_right_width = child.fullbbox[0];
                }
            }
        }
        // 3. stafftop children
        staff_height = 0;
        staff_left_width = 0;
        staff_right_width = 0;
        staff_children = 0;
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'stafftop')
                    continue;
                node.hasOnlyStaffs = false;
                staff_children++;
                staff_height += child.fullbbox[1];
                if (staff_left_width < child.fullbbox[0])
                    staff_left_width = child.fullbbox[0];
            }
        }
        // 4. staffleft children
        staff_height = 0;
        staff_left_width = 0;
        staff_right_width = 0;
        staff_children = 0;
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'staffleft')
                    continue;
                node.hasOnlyStaffs = false;
                staff_children++;
                staff_height += child.fullbbox[1];
            }
        }
        // 5. subordinate children
        var subordinate_full_width = 0;
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'subordinate')
                    continue;
                node.hasOnlyStaffs = false;
                subordinate_full_width += child.fullbbox[0];
            }
        }

        // calc total width and xoffset of this node
        var left_width = 0;
        if (collateral_left_width > left_width)        left_width = collateral_left_width;
        if (staff_left_width > left_width)             left_width = staff_left_width;
        if (subordinate_full_width / 2 > left_width)   left_width = subordinate_full_width / 2;
        var right_width = 0;
        if (collateral_right_width > right_width)      right_width = collateral_right_width;
        if (staff_right_width > right_width)           right_width = staff_right_width;
        if (subordinate_full_width / 2 > right_width)  right_width = subordinate_full_width / 2;
        node.xoffset = left_width - node.boundbox[0] / 2;

        // now calc this node fullbbox, and deltacorner of children
        // 1. collateral children
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'collateral')
                    continue;
                if (child.position == 'left') {
                    child.deltacorner = [
                        left_width - node.boundbox[0] / 2 - child.fullbbox[0],
                        0
                    ];
                } else { // right
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
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'staff')
                    continue;
                if (child.position == 'left') {
                    child.deltacorner = [
                        left_width - child.fullbbox[0],
                        node.boundbox[1] + staff_height
                    ];
                    staff_height += child.fullbbox[1];
                    last_left_height = child.fullbbox[1];
                    // PATCH for case of only one children drawn at botton left of the node
                    if (staff_children == 1) {
                        node.fullbbox[0] += node.boundbox[0];
                    }
                } else { // right
                    child.deltacorner = [
                        left_width,
                        node.boundbox[1] + last_right_height
                    ];
                    last_right_height += child.fullbbox[1];
                    if (child.fullbbox[1] > last_left_height)
                        staff_height += child.fullbbox[1] - last_left_height;
                }
                oc_update_fullbbox(node, child);
            }
        }
        // 3. stafftop children
        if (node.children !== undefined) {
            var stafftop_count = 0;
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'stafftop')
                    continue;
                stafftop_count++;
                child.deltacorner = [
                    left_width + (stafftop_count * child.boundbox[0]) - (child.boundbox[0]),
                    node.boundbox[1]
                ];
                staff_height = child.fullbbox[1];
                oc_update_fullbbox(node, child);
            }
        }
        // 4. staffleft children
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'staffleft')
                    continue;
                child.deltacorner = [
                    left_width - (child.boundbox[0] / 2),
                    node.boundbox[1] + staff_height + 0 * options.vline
                ];
                staff_height += child.fullbbox[1];
                oc_update_fullbbox(node, child);
            }
        }
        // 5. subordinate children
        var incremental_width = 0;
        var diff_width = left_width - subordinate_full_width / 2;
        if (diff_width < 0) diff_width = 0;
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'subordinate')
                    continue;
                child.deltacorner = [
                    diff_width + incremental_width,
                    node.boundbox[1] + staff_height
                ];
                incremental_width += child.fullbbox[0];
            }
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'subordinate')
                    continue;
                oc_update_fullbbox(node, child);
            }
        }

        if (options.debug) {
            if (node.children !== undefined) {
                for (i = 0; i < node.children.length; i++) {
                    child = node.children[i];
                    console.log('oc_boundboxes_dimensions [' + child.title + '] ' +
                        'boundbox(' + child.boundbox[0] + ',' + child.boundbox[1] + ') ' +
                        'deltacenter(' + child.deltacenter[0] + ',' + child.deltacenter[1] + ') ' +
                        'fullbbox(' + child.fullbbox[0] + ',' + child.fullbbox[1] + ') ' +
                        'deltacorner(' + child.deltacorner[0] + ',' + child.deltacorner[1] + ') ' +
                        'xoffset(' + child.xoffset + ')');
                }
            }
        }

        // PATCHES FOR SPECIAL CASES
        //
        if (subtreeMustBeShiftedRight(node)) {
            node.xoffset2    += node.boundbox[0] / 2;
            node.fullbbox[0] += node.boundbox[0] / 2;
        }
    }

    // PATCH 1: the subtree must be shifted right by half of a boundbox
    // see subcases
    function subtreeMustBeShiftedRight(node) {
        if (subtreeMustBeShiftedRightCaseA(node))
            return true;
        if (subtreeMustBeShiftedRightCaseB(node))
            return true;
        return false;
    }

    // PATCH 1, subcase a. node with only staff children and up to one subordinate
    //
    function subtreeMustBeShiftedRightCaseA(node) {
        var subordinate_count = 0; 
        var child_count       = 0;
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child.type == 'subordinate' && subordinate_count === 0)
                    subordinate_count = 1;
                else if (child.type == 'subordinate')
                    return false;
                if (child.type !== 'staff')
                    return false;
                child_count++;
            }
        }
        return child_count > 0;
    }

    // PATCH 1, subcase b. node with a left staff child that has 2+ subordinate children
    //
    function subtreeMustBeShiftedRightCaseB(node) {
        var subordinate_count = 0; 
        if (node.children !== undefined) {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'staff' || child.position == 'right')
                    continue;
                if (child.children === undefined)
                    continue;
                for (j = 0; j < child.children.length; j++) {
                    child2 = child.children[j];
                    if (child2.type == 'subordinate')
                        subordinate_count++;
                        if (subordinate_count >= 2)
                            return true;
                }
            }
        }
        return false;
    }

    // update the full bounding box of a subtree by adding the size and relative position of a child
    //
    function oc_update_fullbbox(node, child) {
        // entran: child.deltacorner, node.fullbbox
        var x0 = 0, y0 = 0, x1 = node.fullbbox[0], y1 = node.fullbbox[1];
        var cdc0 = child.deltacorner[0], cdc1 = child.deltacorner[1];

        // NOT REALLY NEEDED
        // if (child.type == 'staff')
        //    child.position = (oc_staff_position++ % 2 == 0 ? 'left' : 'right');

        // calcs
        if (cdc0 < x0)                     x0 = cdc0;
        if (cdc0 + child.fullbbox[0] > x1) x1 = cdc0 + child.fullbbox[0];
        if (cdc1 + child.fullbbox[1] > y1) y1 = cdc1 + child.fullbbox[1];
        if (x0 < node.deltacorner[0])      node.deltacorner[0] = x0;

        // in nodes with 3+ staff children, ignore them for fullbbox width calculation 
        ignoreXcoords = child.type == 'staff' && child.indexAsStaffChildren > 2;
        node.fullbbox = [ignoreXcoords ? node.fullbbox[0] : x1 - x0, y1 - y0];

        if (options.debug)
            console.log('updatefullbbox ' + node.title + ' <-- ' + child.title + ' // ' +
                'fullbbox=(' + node.fullbbox[0] + ', ' + node.fullbbox[1] + ') // ' +
                ' x0=' + x0 + ' x1=' + x1 + ' y0=' + y0 + ' y1=' + y1);
    }

    // after all calcs, draw the chart into the 'oc_container' DIV
    //
    function oc_draw() {
        oc_paper = new Raphael(document.getElementById(options.container), data.root.fullbbox[0], data.root.fullbbox[1]);
        oc_draw_obj(data.root, null, options.xoffset, options.yoffset, 0);
        // TO_DO draw orgchart title here (unimplemented - you can use HTML for that)
    }

    // draw a subtree
    //
    function oc_draw_obj(node, parent, xoffset, yoffset, xoffset2) {
        if (node === null)
            return;

        // draw children
        if (node.children !== undefined) {
            for (var i = 0; i < node.children.length; i++)
                // oc_draw_obj(node.children[i], node, node.deltacorner[0] + xoffset, node.deltacorner[1] + yoffset);
                oc_draw_obj(node.children[i],
                            node,
                            node.deltacorner[0] + xoffset + node.xoffset2,
                            //node.deltacorner[0] + xoffset,
                            node.deltacorner[1] + yoffset
                           );
        }

        if (options.debug) {
            console.log('drawing ' + node.title + ': legacyXoff=' + xoffset + ' legacyYoff=' + yoffset +
                ' dcornerX=' + node.deltacorner[0] + ' dcornerY=' + node.deltacorner[1] + ' dcenterX=' +
                node.deltacenter[0] + ' dcenterY=' + node.deltacenter[1] + ' xoff=' + node.xoffset);
        }

        // prepare euclidean vars
        var width =  node.boundbox[0] - 2 * options.hline - 2 * options.inner_padding;
        var height = node.boundbox[1] - 2 * options.vline - 2 * options.inner_padding;
        var xc = xoffset + node.deltacorner[0] + node.deltacenter[0] + node.xoffset + node.xoffset2;
        var yc = yoffset + node.deltacorner[1] + node.deltacenter[1];
        var x0 = xc - width / 2 - options.inner_padding;
        var x1 = xc + width / 2 + options.inner_padding;
        var pxc, pyc, px0, px1, py0, py1;
        if (parent !== null) {
            //var pxc = xc - node.xoffset - node.deltacorner[0] + parent.xoffset + (0 - 0);
            pxc = xoffset + parent.deltacenter[0] + parent.xoffset;
            pyc = yc - 0 - node.deltacorner[1] + 0 + (parent.deltacenter[1] - node.deltacenter[1]);
            px0 = pxc - (parent.boundbox[0] - 2 * options.hline - 2 * options.inner_padding) / 2 - options.inner_padding;
            px1 = pxc + (parent.boundbox[0] - 2 * options.hline - 2 * options.inner_padding) / 2 + options.inner_padding;
            py0 = pyc - (parent.boundbox[1] - 2 * options.vline - 2 * options.inner_padding) / 2 - options.inner_padding;
            py1 = pyc + (parent.boundbox[1] - 2 * options.vline - 2 * options.inner_padding) / 2 + options.inner_padding;
        }
        var y0, y1;
        if (options.use_images && node.image !== undefined) {
            //y0 = yc - oc_max_text_height / 2 - options.inner_padding - options.images_size[1] / 2 - options.inner_padding / 2;
            //y1 = yc + oc_max_text_height / 2 + options.inner_padding + options.images_size[1] / 2 + options.inner_padding / 2;
            // Rely on actual size of node rather than some max. height - it is more flexible (you can influence size of box in oc_boundboxes_dimensions())
            y0 = yc - height / 2 - options.inner_padding;
            y1 = yc + height / 2 + options.inner_padding;
        } else {
            //y0 = yc - oc_max_text_height / 2 - options.inner_padding;
            //y1 = yc + oc_max_text_height / 2 + options.inner_padding;
            // Rely on actual size of node rather than some max. height - it is more flexible (you can influence size of box in oc_boundboxes_dimensions())
            y0 = yc - height / 2 - options.inner_padding;
            y1 = yc + height / 2 + options.inner_padding;
        }

        // draw line connectors from box towards the parent, before drawing of boxes
        if (parent !== null) {
            // GG 120613 now lines are from center to center of boxes in order to prepare for the invisible box type
            // i left the previous way to draw lines inside comments
            var path, line;
            if (node.type == 'collateral') {
                if (node.position == 'left') {
                    // path = 'M ' + x1 + ' ' + yc + ' l ' + (2 * options.hline) + ' 0';
                    path = 'M ' + xc + ' ' + yc + ' l ' + (pxc - xc) + ' 0';
                    line = oc_paper.path(path);
                } else { // right
                    // path = 'M ' + x0 + ' ' + yc + ' l -' + (2 * options.hline) + ' 0';
                    path = 'M ' + xc + ' ' + yc + ' l -' + (xc - pxc) + ' 0';
                    line = oc_paper.path(path);
                }
            } else if (node.type == 'staff') {
                if (node.position == 'left') {
                    // path = 'M ' + x1 + ' ' + yc + ' h ' + (pxc - x1) + ' v ' + (pyc - yc);
                    path = 'M ' + xc + ' ' + yc + ' h ' + (pxc - xc) + ' v ' + (pyc - yc);
                    line = oc_paper.path(path);
                } else { // right
                    // path = 'M ' + x0 + ' ' + yc + ' h ' + (pxc - x0) + ' v ' + (pyc - yc);
                    path = 'M ' + xc + ' ' + yc + ' h ' + (pxc - xc) + ' v ' + (pyc - yc);
                    line = oc_paper.path(path);
                }
            } else if (node.type == 'stafftop') {
                // path = 'M ' + xc + ' ' + y0 + ' v -' + options.vline + ' h ' + (pxc - xc) + ' v -' + options.vline;
                path = 'M ' + xc + ' ' + yc + ' v -' + (options.vline + y1 - yc) + ' h ' + (pxc - xc) + ' v -' + (options.vline + py1 - pyc);
                line = oc_paper.path(path);
            } else if (node.type == 'staffleft') {
                // path = 'M ' + x0 + ' ' + yc + ' h -' + options.hline + ' v ' + (pyc - yc) + ' h ' + options.hline;
                path = 'M ' + xc + ' ' + yc + ' h -' + (options.hline + xc - x0) + ' v ' + (pyc - yc) + ' h ' + (options.hline + pxc - px0);
                line = oc_paper.path(path);
            } else { // subordinate
                if (node.is_root === undefined) {
                    // path = 'M ' + xc + ' ' + y0 + ' v -' + options.vline + ' h ' + (pxc - xc) + ' V ' + py1;
                    path = 'M ' + xc + ' ' + yc + ' v -' + (options.vline + yc - y0)+ ' h ' + (pxc - xc) + ' V ' + pyc;
                    line = oc_paper.path(path);
                }
            }
            line.attr('stroke', options.line_color);
            // FYI: stroke-opacity worked from stroke-width 1.8 and above for me
            line.attr('stroke-width', 2);
            // opacity to 1 to disquise that lines are over each other
            line.attr('stroke-opacity', 1);
            line.attr('stroke-linejoin', "round");
        }

        // now draw the box
        var box;
        if (node.visible === undefined || node.visible === true) {
            box = oc_paper.rect(x0, y0, x1 - x0, y1 - y0, options.box_border_radius);
            box.attr('fill', options.box_color);
            box.attr('stroke', options.box_border_color);
            box.attr('stroke-width', options.box_border_width);
            box.visible = true;
        }
        else {
            box = { visible : false };
        }

        // draw optional images
        if (options.use_images && node.image !== undefined) {
            if (node.image_position !== undefined && node.image_position == "above") {   // text below image
                image = oc_paper.image(options.images_base_url + node.image,
                        xc - options.images_size[0] / 2, y0 + options.inner_padding,
                        options.images_size[0], options.images_size[1]);
            }
            else {   // text above image (default)
                image = oc_paper.image(options.images_base_url + node.image,
                        xc - options.images_size[0] / 2, y1 - options.images_size[1] - options.inner_padding,
                        options.images_size[0], options.images_size[1]);
            }
        }

        // drawing of title and subtitle is left second branch of the following code
        // the first branch is for the first form of calling the library
        // and the second branch is for the second form of calling
        // TO_DO drawing titles below images for the first form of calling the library
        if (typeof options.box_html_template == "string") {
            var hBox = new htmlBox(oc_paper, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
            var template = jQuery("#" + options.box_html_template);
            if (template.length !== 0 && hBox.div !== null) {
                hBox.div.html(template.render(node));
            }
            if (options.debug) {
                console.log('drawing ' + node.title + ' htmlBox: x=' + x0 + ' y=' + y0 + ' width=' + (x1 - x0) + ' height=' + (y1 - y0));
            }
            if (typeof (options.box_callback) == "function") {
                node.options = options;
                options.box_callback(box, hBox, node);
            }
        }
        else {
            if (typeof (options.box_callback) == "function") {
                options.box_callback(box);
            }
            if (node.id !== undefined)
                box.oc_id = node.id;
            var event_box_color_hover = options.box_color_hover;
            var event_box_color = options.box_color;
            // attach events to rectangle
            if (box.visible === true) {
                box.hover(
                    function (/*event*/) { this.attr({ fill: event_box_color_hover }); },
                    function (/*event*/) { this.attr({ fill: event_box_color }); }
                    //, overScope, outScope
                );
                if (options.box_click_handler !== null && options.box_click_handler !== undefined)
                    box.click(function (event) { options.box_click_handler(event, box); });

                // draw node title and subtitle
                var title_ypos = y0 + options.inner_padding +
                    node.title_lines * options.title_char_size[1] / 2 +
                    (oc_max_title_lines - node.title_lines) * options.title_char_size[1] / 2 -
                    2;
                if ((options.use_images && node.image !== undefined) && 
                    (node.image_position !== undefined && node.image_position == "above")) {   // text below image
                    title_ypos += options.images_size[1] + options.inner_padding;
                }
                var title = oc_paper.text(xc, title_ypos, node.title);
                title.attr('font-family', options.text_font);
                title.attr('font-size', options.title_font_size);
                title.attr('fill', options.title_color);
                if (node.subtitle !== undefined) {
                    var subtitle_ypos = y1 - options.inner_padding -
                        node.subtitle_lines * options.subtitle_char_size[1] / 2;
                    if (options.use_images && node.image !== undefined)
                        subtitle_ypos -= options.images_size[1] + options.inner_padding;
                    if ((options.use_images && node.image !== undefined) &&
                        (node.image_position !== undefined && node.image_position == "above")) {   // text below image
                        subtitle_ypos += options.images_size[1] + options.inner_padding;
                        //alert(title_ypos + " -- " + subtitle_ypos);
                        //subtitle_ypos += options.images_size[1] + 50;
                    }
                    var subtitle = oc_paper.text(xc, subtitle_ypos, node.subtitle);
                    subtitle.attr('font-family', options.text_font);
                    subtitle.attr('font-size', options.subtitle_font_size);
                    subtitle.attr('fill', options.subtitle_color);
                }
            }
        }

        if (options.debug) {
            // draw the boundbox
            x0 = xoffset + node.deltacorner[0] + node.xoffset + node.xoffset2;
            x1 = xoffset + node.deltacorner[0] + node.xoffset + node.xoffset2 + node.boundbox[0];
            y0 = yoffset + node.deltacorner[1];
            y1 = yoffset + node.deltacorner[1] + node.boundbox[1];
            var boundbox = oc_paper.rect(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 6);
            boundbox.attr({
                stroke: "#00f",
                "stroke-width": 0.4
            });
            // draw the fullbbox
            x0 = xoffset + node.deltacorner[0];
            x1 = xoffset + node.deltacorner[0] + node.fullbbox[0];
            y0 = yoffset + node.deltacorner[1];
            y1 = yoffset + node.deltacorner[1] + node.fullbbox[1];
            var fullbbox = oc_paper.rect(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 2);
            fullbbox.attr({
                stroke: "#f00",
                "stroke-width": 0.4
            });
        }
    }

    // takes a raphaeljs object, some options, and some container attributes
    // http://rubyscale.com/blog/2010/11/22/embedding-arbitrary-html-into-raphaeljs/
    //
    function htmlBox(aPaper, aOptions) {
        aOptions = aOptions || {};
        this.paper = aPaper;
        this.x = aOptions.x || 0;
        this.y = aOptions.y || 0;
        this.width = aOptions.width || this.paper.width;
        this.height = aOptions.height || this.paper.height;
        this.enableOffset = options.enableOffset || false;
        this.raphaelContainer = jQuery('#' + options.container);

        this.div = jQuery('<div style="position: absolute; width: 0; height: 0;" class="node"></div>').appendTo(this.raphaelContainer);
        this.update();
        // If you don't call ggOrgChart.render(data, options); in $(document).ready(function () {...}); 
        // then you should use following approach instead this.update();
        //jQuery(document).bind('ready', this, function(event) { event.data.update(); });
        //jQuery(window).bind('resize', this, function(event) { event.data.update(); });
    }

    htmlBox.prototype.update = function () {
        var offset = this.raphaelContainer.offset();
        if (!this.enableOffset)
            this.raphaelContainer.css({ 'position': 'relative' });
        this.div.css({
            'top': (this.y + (this.enableOffset ? offset.top : 0)) + 'px',
            'left': (this.x + (this.enableOffset ? offset.left : 0)) + 'px',
            'height': (this.height + 'px'),
            'width': (this.width + 'px')
        });
    };

    htmlBox.prototype.remove = function () {
        this.div.remove();
    };

})(window);

// END OF LIBRARY