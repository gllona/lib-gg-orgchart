/*
* lib_gg_orgchart 1.0.0 - JavaScript Organizational Chart Drawing Library
*
* Copyright (c) 2012-2014 Gorka G Llona - http://desarrolladores.logicos.org/gorka.
* Project home: http://librerias.logicas.org/lib_gg_orgchart.
*
* Licensed under the GNU Lesser General Public License.
* Portions are licensed under the MIT License.
* 
* Revision history:
* v.0.4.0        (2012.05.14, GG): made publicly available
* v.0.4.1 beta 1 (2012.07.11, GG): added support for images within boxes
* v.0.4.1 beta 2 (2012.08.20, YL): fixed rendering issues with IE8
* v.0.4.1 beta 3 (2012.12.15, MJ): fixed "more than 3 staff" issue
* v.0.4.1 beta 4 (2013.01.01, MJ): added new options box_border_radius, box_border_width, box_fix_width and box_fix_height
* v.0.4.1 beta 5 (2013.01.05, MJ): fixed rendering issues with IE8 (oc_IE thing)
* v.0.4.2 beta 1 (2013.01.09, MJ): encapsulation, performance improvements
* v.0.4.2 beta 2 (2013.01.10, MJ): added staffleft and stafftop nodes
* v.0.4.2 beta 3 (2013.01.11, MJ): added "html templates" optional feature; depends on jsrender and jQuery libraries
* v.0.4.2 beta 4 (2013.01.11, MJ): avoided of using oc_max_text_height in oc_draw_obj()
* v.0.4.2 beta 5 (2013.01.16, MJ): added new options box_root_node_width and box_root_node_height
* v.0.4.2 beta 6 (2013.01.16, MJ): changed rendering of staff (to have all nodes on the same line)
* v.0.4.3 beta 1 (2013.05.22, GG): integrated patches from some users, fix rendering issues, and released minor version
* v.0.4.3 beta 2 (2013.06.12, GG): implemented "invisible" nodes for greater flexibility
* v.0.4.3 beta 2 (2013.06.12, GG): allowed drawing the text inside boxes above or below images
* v.0.4.3 beta 3 (2013.08.28, RK): fixed regression: rendering issues in IE 7 and 8
* v.0.4.4 beta 1 (2013.09.25, GG): (N/R) fixed issues rendering nodes with both images and subtitles; simplify calling syntax
* v.0.4.4 beta 2 (2014.03.10, BG): (N/R) allows loading the JSON graph structure from an external file
* v.0.4.4 beta 3 (2014.03.13, JV): (N/R) implemented initial zoom and print capabilities, and "dashed nodes" feature
* v.0.4.4 beta 4 (2014.03.15, GG): (N/R) fixes rendering issues, better usage of space for rendering, reversed 0.4.2 beta 6
* v.0.4.4 beta 5 (2014.03.17, GG): (N/R) completes zoom and print, allows multiples renders per web page
* v.0.4.4 beta 6 (2014.03.17, GG): (N/R) full encapsulation, new and simplifyed library syntax for calling and rendering
* v.1.0.0 beta 1 (2014.03.20, GG): integration of 0.4.4 beta series :: major release, first 1.x version number
*
* Contributors (in order of appearance):
* GG :: Gorka G LLONA
* YL :: Yoann LECUYER
* MJ :: Milan JAROŠ
* RB :: Rob BOERMAN
* JB :: Jean-Paul BEHRNES
* RK :: Ryad BEN-EL-KEZADRI
* BG :: Brother GABRIEL-MARIE
* JV :: Joel VILLAR
*
* NOTE: take in mind that v.1.0.0 and forward is not backward-compatible with the v.0.4 series
*       however, the "options" are, but there are other options available
*       (a new field, "data_id", must be assigned to options, and a field "id" must be assigned for data)
*       the form of calling is very simplified and cleaner than the previous versions of this library
*       this release needs a browser compatible with HTML5
*/



// NON-ENCAPSULATED PART OF THE LIBRARY



// for use by jspdf, needs global scope
// note that jspdf is a customized version
//
var oc_zdp_width,
    oc_zdp_height;



// ENCAPSULATED PART OF THE LIBRARY



( function (window, undefined) {



    // declaration of variables in local scope for better performance
    // see below (after public functions) for the default styles for the chart (that can be overrided)
    // these variables are general, not related to any particular "options"
    //
    var document                     = window.document;
    var options_heap                 = [];
    var data_heap                    = [];
    var oc_first_json_load_initiated = false;



    // "PUBLIC" FUNCTIONS AND DEFINITIONS



    window.ggOrgChart = {



        // call this function in order to render a chart where the data comes from an external JSON file
        // if "this_json_file" (filename) is "null", then use the library will use a previously loaded JSON file
        // this is useful when rendering the same data with different options (and containers)
        // keep in mind that if the JSON don't have the "id" assigned, the graph will be rendered with the "options"
        // that has the value "1" in the field data_id" (if not found among the different "options", no rendering will be done)
        // returns false in case of wrong passed arguments or incapability to work with jQuery or jsrender; true otherwise
        //
        render: function (options, json_file)
        {
            // verify libraries if needed
            if (typeof options.box_html_template == "string") {
                if (typeof window.jQuery == "undefined") {
                    console.log("ggOrgChart: jQuery is not loaded properly");
                    return false;
                }
                else {
                    var j = jQuery("<div></div>");
                    if (typeof j.render != "function") {
                        console.log("ggOrgChart: jsrender.js is not loaded properly");
                        return false;
                    }
                }
            }
            // disable AJAX cache
            $.ajaxSetup( { cache: false } );
            return oc_render(options, json_file);
        },



        // call this function for zoom in
        //
        zoom_in: function (options) {
            oc_zoom_in(options);
        },



        // call this function for zoom out
        //
        zoom_out: function (options) {
            oc_zoom_out(options);
        },



        // call this function for generating a PDF with the chart
        //
        print: function (options) {
            oc_print(options);
        },

    } ;



    // default options for the chart (can be overrided when calling the render() method)
    //
    var defaultOptions = {
        container: 'oc_container',            // name of the DIV where the chart will be drawn
        vline: 10,                            // size of the smallest vertical line of connectors
        hline: 10,                            // size of the smallest horizontal line of connectors
        xoffset: 0,                           // inital x-offset of diagram (can be negative)
        yoffset: 0,                           // inital y-offset of diagram (can be negative)
        inner_padding: 10,                    // space from text to box border
        box_color:        '#D9EDF7',          // fill color of boxes
        box_color_hover:  '#E9FDF7',          // fill color of boxes when mouse is over them
        box_border_color: '#BCE8F1',          // stroke color of boxes
        box_border_radius: 8,                 // border radius of boxes in pixels
        box_border_width: 2,                  // border with of boxes in pixels
        box_fix_width: null,                  // set fix width for boxes in pixels
        box_fix_height: null,                 // set fix height for boxes in pixels
        box_root_node_width: null,            // override fix width and max text width
        box_root_node_height: null,           // override fix height and size defined by text length
        box_html_template: null,              // id of element with template; Depends on jsrender and jQuery libraries!
        line_color:     '#3A87AD',            // color of connectors
        title_color:    '#3A87AD',            // color of titles
        subtitle_color: '#1A678D',            // color of subtitles
        title_font_size: 12,                  // size of font used for displaying titles inside boxes
        subtitle_font_size: 10,               // size of font used for displaying subtitles inside boxes
        title_char_size: [7, 12.5],           // size (x, y) of a char of the font used for displaying titles
        subtitle_char_size: [5, 10],          // size (x, y) of a char of the font used for displaying subtitles
        max_text_width: 0,                    // max width (in chars) of each line of text ('0' for no limit)
        text_font: 'Lucida Console, Courier', // font family to use (should be monospaced)
        use_images: false,                    // use images within boxes?
        images_base_url: './images/',         // base url of the images to be embeeded in boxes, with a trailing slash
        images_size: [160, 160],              // size (x, y) of the images to be embeeded inside boxes
        box_click_handler: undefined,         // handler (function) called on click on boxes (set to null if no handler)
        // here comes the new parameters introduced in version 1.0.0 of the library
        data_id: 1,                           // identifies the ID of the "data" JSON object that is paired with these options
        dashed_box_color       : '#FFFFFF',   // fill   color of "dashed" boxes (assign "subtype:dashed" to node)
        dashed_box_color_hover : '#D9EDF7',   // hover  color of "dashed" boxes (assign "subtype:dashed" to node)
        dashed_box_border_color: '#AAAAFF',   // border color of "dashed" boxes (assign "subtype:dashed" to node)
        use_zoom_print: false,                // wheter to use zoom and print or not (only one graph per web page can do so)
        container_supra: 'oc_supracontainer', // container of the container (DIV); needed for zoom and print
        initial_zoom: 0.75,                   // initial zoom
        pdf_canvas: 'oc_print_canvas',        // name of the invisible HTML5 canvas needed for print
        pdf_canvas_width: 800,                // size of the container (X axis) (must be identic as the supracointainer DIV)
        pdf_canvas_height: 600,               // size of the container (Y axis) (must be identic as the supracointainer DIV)
        pdf_filename: 'orgChart.pdf',         // default filename for PDF printing
        // here finish the new parameters
        debug: false                          // set to true if you want to debug the library
    } ;



    // END OF "PUBLIC" FUNCTIONS AND DEFINITIONS

    // "PRIVATE" FUNCTIONS



    // try to match elements between options_heap and data_heap
    // when a match is encountered, then calls the function that does the actual drawing of the chart
    // this function is repeated each 500 msec in order to render all the graphs,
    // independently of the time in which the render() call is done by the mail web page
    //
    function oc_render_load_and_match ()
    {
        // inputs: "options_heap" and "data_heap" (both filled by oc_render)
        //
        // get the DATA objects that require rendering in one or more of the existent OPTIONS
        // each OPTIONS will render only one DATA, so there is no need to wait for further DATAS loads
        // in order to do this, we iterate on the DATAS_HEAP and then in the OPTIONS_HEAP, seeking for matches,
        // but we exclude OPTIONS that have the ".data" attribute assigned (they are rendered or being rendered just now)
        // this process will build an array of OPTIONS to process just below
        var options_to_process = [];
        var this_options;
        for (var i = 0; i < data_heap.length; i++) {
            var this_data = data_heap[i];
            for (var j = 0; j < options_heap.length; j++) {
                this_options = options_heap[j];
                if (this_options.data_id == this_data.id) {
                    if (typeof this_options.data != "undefined")
                        continue;
                    this_options.data = this_data;
                    var len = options_to_process.push(this_options);
                }
            }            
        }

        // iterate on the identified OPTIONS (all of them with ".data"), and initiate the rendering for each ono
        // this process is not asynchronous
        for (i = 0; i < options_to_process.length; i++) {
            this_options = options_heap[i];
            oc_render_start_drawing(this_options);
        }

        // re-enter this function forever, because we can't know when the webpage will finish calls to render()
        // of course, when the web page is closed, this process will terminate
        setTimeout(oc_render_load_and_match, 500);
    }



    // called by the public "render" function
    // returns false in case of malformed or wrong parameters; otherwise the "merged options" new object
    // 
    function oc_render (this_options, this_json_file)
    {
        // check for correctness of the function call
        if (this_options === null || typeof this_options == "undefined") {
            console.log('ggOrgChart: render: "options" must be defined');
            return false;
        }
        if ( ! (typeof this_json_file == "string" || this_json_file === null) ) {
            console.log('ggOrgChart: render: "json_file" should be the name of a JSON file, or null for using a previous JSON load');
            return false;
        }

        // set defined options and it's values over default options and save in the options heap
        // also define, in this object, working properties and semaphores needed for rendering of multiple graphs
        var defaultsCopy = oc_clone(defaultOptions);
        var merged = oc_mergeOptions(defaultsCopy, this_options);
        merged.data                  = undefined;
        merged.oc_json_file          = this_json_file;
        merged.oc_max_text_width     = 0;
        merged.oc_max_text_height    = 0;
        merged.oc_max_title_lines    = 0;
        merged.oc_max_subtitle_lines = 0;
        merged.oc_paper              = null;
        merged.oc_horizontalGrowts   = [ 0, 0 ];   // widths for (1) root.xoffset (2) root.fullbbox[0]
        if (parseInt(merged.data_id) <= 0)
            merged.data_id = 1;

        // save the options in the "options" heap for further processing by oc_render_load_and_match
        options_heap.push(merged);
        if (! oc_first_json_load_initiated) {
            oc_first_json_load_initiated = true;
            oc_render_load_and_match();
        }

        // get the JSON (if its name is passed thru); if not passed, do nothing, because the "data" is already in the data heap
        if (merged.oc_json_file !== null) {
            $.getJSON(merged.oc_json_file, function (loaded_data) {
                if (typeof loaded_data != "object")
                    loaded_data = { "id": 1, "root": { "id": 1, "title": "data: bad specification" } };
                else if (parseInt(loaded_data.id) <= 0)
                    loaded_data.id = 1;
                data_heap.push(loaded_data);
            } ); 
        }

        // no errors in correctness of this function call; return merged options
        return merged;
    }



    // after load of the external JSON or re-assignment, finally render the chart
    //
    function oc_render_start_drawing (options)
    {
        oc_calc(options, options.data);
        oc_draw(options, options.data);
        if (options.use_zoom_print === true) {
            oc_zoom_print_prepare(options);
        }
    }



    // clone an object or array
    // 
    function oc_clone (obj) 
    {
        var newObj = (obj instanceof Array) ? [] : {};
        for (var i in obj) {
            if (typeof obj[i] != "undefined" && obj[i] !== null && typeof obj[i] == "object")
                newObj[i] = oc_clone(obj[i]);
            else
                newObj[i] = obj[i];
        }
        return newObj;
    }



    // overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
    //
    function oc_mergeOptions (obj1, obj2) 
    {
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
    function oc_add2point (base, delta) 
    {
        base[0] += delta[0];
        base[1] += delta[1];
    }



    // return a string made by repeating 'str' 'times' times
    //
    function oc_repeat_str (str, times) 
    {
        var result = '';
        for (var i = 0; i < times - 1; i++)
            result += str;
        return result;
    }



    // calc all orgchart metrics needed for drawing
    //
    function oc_calc (options, data) 
    {
        oc_text_limit(options, data.root);
        oc_delete_special_chars(data.root);
        oc_text_dimensions(options, data.root);
        data.root.is_root = true;
        oc_boundboxes_dimensions(options, data.root);
    }



    // insert newlines in titles and subtitles in order to meet max_text_width limit of each line
    //
    function oc_text_limit (options, node) 
    {
        // IE fix. It is used instead of oc_IE
        if (node === null)
            return;
        if (options.max_text_width === 0)
            return;
        node.title = oc_text_limit_obj(options, node.title);
        node.subtitle = oc_text_limit_obj(options, node.subtitle);
        if (typeof node.children == "undefined")
            return;
        for (var i = 0; i < node.children.length; i++)
            oc_text_limit(options, node.children[i]);
    }



    // insert newlines in a string in order to meet max_text_width limit
    //
    function oc_text_limit_obj (options, str) 
    {
        if (typeof str == "undefined")
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
    function oc_delete_special_chars (node) 
    {
        if (node === null)
            return;
        node.title = oc_delete_special_chars_obj(node.title);
        node.subtitle = oc_delete_special_chars_obj(node.subtitle);
        if (typeof node.children == "undefined")
            return;
        for (var i = 0; i < node.children.length; i++)
            oc_delete_special_chars(node.children[i]);
    }



    // substitute special chars in a string
    //
    function oc_delete_special_chars_obj (str) 
    {
        if (str === null || typeof str == "undefined")
            return undefined;
        str = str.replace(/á/g, 'a');
        str = str.replace(/é/g, 'e');
        str = str.replace(/í/g, 'i');
        str = str.replace(/ó/g, 'o');
        str = str.replace(/ú/g, 'u');
        str = str.replace(/ü/g, 'u');
        str = str.replace(/Á/g, 'A');
        str = str.replace(/É/g, 'E');
        str = str.replace(/Í/g, 'I');
        str = str.replace(/Ó/g, 'O');
        str = str.replace(/Ú/g, 'U');
        str = str.replace(/Ä/g, 'Ae');
        str = str.replace(/ä/g, 'ae');
        str = str.replace(/Ö/g, 'Oe');
        str = str.replace(/ö/g, 'oe');
        str = str.replace(/Ü/g, 'Ue');
        str = str.replace(/ü/g, 'ue');
        str = str.replace(/ß/g, 'ss');
        str = str.replace(/ñ/g, 'n');
        str = str.replace(/Ñ/g, 'N');
        return str;
    }



    // calc text dimensions in order to calc size of boxes
    // result will be stored in global variables
    //
    function oc_text_dimensions (options, node) 
    {
        if (node === null)
            return;
        var dimensions_title = [0, 0];
        var dimensions_subtitle = [0, 0];
        node.title_lines = node.subtitle_lines = 0;

        // check title dimensions
        dimensions_title = oc_text_dimensions_obj(node.title, options.title_char_size);
        node.title_lines = dimensions_title[2];
        if (node.title_lines > options.oc_max_title_lines)
            options.oc_max_title_lines = node.title_lines;

        // check subtitle dimensions
        if (typeof node.subtitle != "undefined") {
            dimensions_subtitle = oc_text_dimensions_obj(node.subtitle, options.subtitle_char_size);
            node.subtitle_lines = dimensions_subtitle[2];
            if (node.subtitle_lines > options.oc_max_subtitle_lines)
                options.oc_max_subtitle_lines = node.subtitle_lines;
        }

        // check node dimensions vs stored dimensions
        if (options.box_fix_width) {
            options.oc_max_text_width = options.box_fix_width - 2 * options.inner_padding;
        } else {
            if (dimensions_title[0] > options.oc_max_text_width)
                options.oc_max_text_width = dimensions_title[0];
            if (options.use_images && options.images_size[0] > options.oc_max_text_width)
                options.oc_max_text_width = options.images_size[0];
            if (dimensions_subtitle[0] > options.oc_max_text_width)
                options.oc_max_text_width = dimensions_subtitle[0];
        }
        if (options.box_fix_height) {
            options.oc_max_text_height = options.box_fix_height - 2 * options.inner_padding;
        } else {
            if (dimensions_title[1] + dimensions_subtitle[1] > options.oc_max_text_height)
                options.oc_max_text_height = dimensions_title[1] + dimensions_subtitle[1];
        }

        // traverse children
        if (typeof node.children == "undefined")
            return;
        for (var i = 0; i < node.children.length; i++)
            oc_text_dimensions(options, node.children[i]);

        // make horizontal dimensions an even number in order that divided by 2 doesn't have decimals
        if (options.oc_max_text_width % 2 === 1)
            options.oc_max_text_width++;
    }



    // calc the size (in pixels) of a multi-line string
    // third element of the returned array is the number of lines of the text
    //
    function oc_text_dimensions_obj (text, font_pixels) 
    {
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
    function oc_boundboxes_dimensions (options, node) 
    {
        if (node === null)
            return;

        var child, i;

        // complete attributes
        // if (typeof node.is_root != "undefined")
        if (typeof node.deltacorner == "undefined")
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
        if (typeof node.children != "undefined") {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                child.parent = node;
                if (child.type == 'staff') {
                    child.indexAsStaffChildren = ++oc_staff_counter;
                    child.position = (oc_staff_position++ % 2 === 0 ? 'left' : 'right');
                }
                else if (child.type == 'collateral') {
                    child.indexAsCollateralChildren = ++oc_collateral_counter;
                    child.position = (oc_collateral_position++ % 2 === 0 ? 'left' : 'right');
                }
                else if (typeof child.type == "undefined" || child.type == 'subordinate') {
                    child.indexAsSubordinateChildren = ++oc_subordinate_counter;
                }
                oc_boundboxes_dimensions(options, child);
            }
        }

        // now each child have: parent, indexes, boundbox, deltacenter, fullbbox, deltacorner and xoffset
        // now calc this node boundbox and deltacenter
        //
        node.boundbox = [
            options.oc_max_text_width  + 2 * options.inner_padding,
            options.oc_max_text_height + 2 * options.inner_padding
        ];
        if (node.is_root) {
            if (options.box_root_node_width)
                node.boundbox[0] = options.box_root_node_width;
            if (options.box_root_node_height)
                node.boundbox[1] = options.box_root_node_height;
        }

        // add vertical space for images within boxes
        if (options.use_images && typeof node.image != "undefined")
            node.boundbox[1] += options.inner_padding * 1 + options.images_size[1];

        var y = node.boundbox[1];
        if (typeof node.is_root != "undefined") {
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
        //
        node.hasOnlyStaffs = true;
        node.fullbbox = oc_clone(node.boundbox);
        if (typeof node.children == "undefined")
            node.xoffset = 0;
        // 1. collateral children
        var collateral_left_width = node.boundbox[0] / 2;
        var collateral_right_width = node.boundbox[0] / 2;
        var collateral_children = 0;
        if (typeof node.children != "undefined") {
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
        if (typeof node.children != "undefined") {
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
        var stafftop_children = 0;
        if (typeof node.children != "undefined") {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'stafftop')
                    continue;
                node.hasOnlyStaffs = false;
                stafftop_children++;
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
        if (typeof node.children != "undefined") {
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
        if (typeof node.children != "undefined") {
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
        //
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
        if (typeof node.children != "undefined") {
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
            }
        }
        // 2. staff children
        var staff_left_height  = 0;
        var staff_right_height = 0;
        var staff_height_left  = 0;
        var staff_height_right = 0;
        staff_height           = 0;
        if (typeof node.children != "undefined") {
            var staffCountForThisNode = 0;
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                if (child === null)
                    continue;
                if (child.type != 'staff')
                    continue;
                staffCountForThisNode++;
                if (child.position == 'left') {
                    child.deltacorner = [
                        left_width - child.fullbbox[0],
                        node.boundbox[1] + staff_height_left
                    ];
                    staff_height_left += child.fullbbox[1];
                } else { // right
                    child.deltacorner = [
                        left_width + 0,
                        node.boundbox[1] + staff_height_right
                    ];
                    staff_height_right += child.fullbbox[1];
                }
                staff_height = (staff_height_left > staff_height_right ? staff_height_left : staff_height_right);
            }
        }
        // 3. stafftop children
        if (typeof node.children != "undefined") {
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
            }
        }
        // 4. staffleft children
        if (typeof node.children != "undefined") {
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
            }
        }
        // 5. subordinate children
        var incremental_width = 0;
        var diff_width = left_width - subordinate_full_width / 2;
        if (diff_width < 0) diff_width = 0;
        if (typeof node.children != "undefined") {
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
            }
        }

        // patch the calculated metrics (X axis): 
        // - center the nodes according to the metrics of their children
        // - then enlarge their respective fullbboxes
        //
        var this_horizontalGrowts = [0, 0];
        if (typeof node.children != "undefined") {
            var pt1, pt2;
            // left side
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                pt1 = child.deltacorner[0];
                if (pt1 < 0 && (- pt1 > this_horizontalGrowts[0]))
                    this_horizontalGrowts[0] = (- pt1);
            }
            node.xoffset += this_horizontalGrowts[0];
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                child.deltacorner[0] += this_horizontalGrowts[0];
            }
            // right side
            pt1 = node.fullbbox[0];
            pt2 = child.fullbbox[0];
            if (pt1 < pt2) {
                this_horizontalGrowts[1] = pt2 - pt1;
                node.fullbbox[0] += this_horizontalGrowts[1];
            }
        }

        // calculate by recursion the full bounding box of the node (after patches)
        // this needs to be calculated at the end of the previuos calculations for all the children of the node,
        // because the above pathh (left case) apply displacements in all its brothers to the right
        //
        var new_horizontalGrowts = [0, 0];
        if (typeof node.children != "undefined") {
            for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                new_horizontalGrowts = oc_update_fullbbox(options, node, child);
            }
        }

        // accumulate the offset to the right that the whole graph should apply when drawing
        //
        if (new_horizontalGrowts[0] > options.oc_horizontalGrowts[0]) {
            options.oc_horizontalGrowts[0] = new_horizontalGrowts[0];
        }
        if (this_horizontalGrowts[1] > options.oc_horizontalGrowts[1]) {
            options.oc_horizontalGrowts[1] = new_horizontalGrowts[1];
        }

        // debug
        //
        if (options.debug) {
            if (typeof node.children != "undefined") {
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
    }



    // update the full bounding box of a subtree by adding the size and relative position of a child
    //
    function oc_update_fullbbox (options, node, child) 
    {
        // input data: child.deltacorner, base node.fullbbox (for updating)
        var nX0 = 0, nY0 = 0, nX1 = node.fullbbox[0], nY1 = node.fullbbox[1];
        var cdcX = child.deltacorner[0], cdcY = child.deltacorner[1];

        // calcs
        if (cdcX < nX0)                     nX0 = cdcX;
        if (cdcX + child.fullbbox[0] > nX1) nX1 = cdcX + child.fullbbox[0];
        if (cdcY + child.fullbbox[1] > nY1) nY1 = cdcY + child.fullbbox[1];
        if (nX0 < node.deltacorner[0])      node.deltacorner[0] = nX0;
        node.fullbbox = [nX1 - nX0, nY1 - nY0];

        // debug
        if (options.debug)
            console.log('updatefullbbox ' + node.title + ' <-- ' + child.title + ' // ' +
                'fullbbox=(' + node.fullbbox[0] + ', ' + node.fullbbox[1] + ') // ' +
                ' nX0=' + nX0 + ' nX1=' + nX1 + ' nY0=' + nY0 + ' nY1=' + nY1);

        // return the offset that must be used to displace the whole graph to the right (if this is the maximum for the whole graph)
        return [ child.fullbbox[0] / 2, 0];
    }



    // after all calcs, draw the chart into the 'oc_container' DIV
    //
    function oc_draw (options, data) 
    {
        data.root.fullbbox[1] += 3;
        options.oc_paper = new Raphael(document.getElementById(options.container), data.root.fullbbox[0], data.root.fullbbox[1]);
        oc_draw_obj(options, data.root, null, options.xoffset, options.yoffset, 0);
        // TO_DO draw orgchart title here (unimplemented - you can use HTML for that)
    }



    // draw a subtree
    //
    function oc_draw_obj (options, node, parent, xoffset, yoffset, xoffset2) 
    {
        if (node === null)
            return;

        // draw children
        //
        if (typeof node.children != "undefined") {
            for (var i = 0; i < node.children.length; i++) {
                oc_draw_obj(options,
                            node.children[i],
                            node,
                            node.deltacorner[0] + xoffset + node.xoffset2,
                            //node.deltacorner[0] + xoffset,
                            node.deltacorner[1] + yoffset
                           );
            }
        }

        // debug
        //
        if (options.debug) {
            console.log('drawing ' + node.title + ': legacyXoff=' + xoffset + ' legacyYoff=' + yoffset +
                ' dcornerX=' + node.deltacorner[0] + ' dcornerY=' + node.deltacorner[1] + ' dcenterX=' +
                node.deltacenter[0] + ' dcenterY=' + node.deltacenter[1] + ' xoff=' + node.xoffset);
        }

        // prepare euclidean vars
        //
        var width =  node.boundbox[0] - 2 * options.hline - 2 * options.inner_padding;
        var height = node.boundbox[1] - 2 * options.vline - 2 * options.inner_padding;
        var xc = xoffset + node.deltacorner[0] + node.deltacenter[0] + node.xoffset + node.xoffset2;
        var yc = yoffset + node.deltacorner[1] + node.deltacenter[1];
        var nX0 = xc - width / 2 - options.inner_padding;
        var nX1 = xc + width / 2 + options.inner_padding;
        var pxc, pyc, pnY0, pnY1, pnX0, pnX1, nY0, nY1;
        if (parent !== null) {
            pxc = xoffset + parent.deltacenter[0] + parent.xoffset;
            pyc = yc - 0 - node.deltacorner[1] + 0 + (parent.deltacenter[1] - node.deltacenter[1]);
            pnX0 = pxc - (parent.boundbox[0] - 2 * options.hline - 2 * options.inner_padding) / 2 - options.inner_padding;
            pnX1 = pxc + (parent.boundbox[0] - 2 * options.hline - 2 * options.inner_padding) / 2 + options.inner_padding;
            pnY0 = pyc - (parent.boundbox[1] - 2 * options.vline - 2 * options.inner_padding) / 2 - options.inner_padding;
            pnY1 = pyc + (parent.boundbox[1] - 2 * options.vline - 2 * options.inner_padding) / 2 + options.inner_padding;
        }
        if (options.use_images && typeof node.image != "undefined") {
            nY0 = yc - height / 2 - options.inner_padding;
            nY1 = yc + height / 2 + options.inner_padding;
        } else {
            nY0 = yc - height / 2 - options.inner_padding;
            nY1 = yc + height / 2 + options.inner_padding;
        }

        // draw line connectors from box towards the parent, before drawing of boxes
        //
        if (parent !== null) {
            var path, line;
            if (node.type == 'collateral') {
                if (node.position == 'left') {
                    path = 'M ' + xc + ' ' + yc + ' l ' + (pxc - xc) + ' 0';
                    line = options.oc_paper.path(path);
                } else { // right
                    path = 'M ' + xc + ' ' + yc + ' l -' + (xc - pxc) + ' 0';
                    line = options.oc_paper.path(path);
                }
            } else if (node.type == 'staff') {
                if (node.position == 'left') {
                    path = 'M ' + xc + ' ' + yc + ' h ' + (pxc - xc) + ' v ' + (pyc - yc);
                    line = options.oc_paper.path(path);
                } else { // right
                    path = 'M ' + xc + ' ' + yc + ' h ' + (pxc - xc) + ' v ' + (pyc - yc);
                    line = options.oc_paper.path(path);
                }
            } else if (node.type == 'stafftop') {
                path = 'M ' + xc + ' ' + yc + ' v -' + (options.vline + nY1 - yc) + ' h ' + (pxc - xc) + ' v -' + (options.vline + pnY1 - pyc);
                line = options.oc_paper.path(path);
            } else if (node.type == 'staffleft') {
                path = 'M ' + xc + ' ' + yc + ' h -' + (options.hline + xc - nX0) + ' v ' + (pyc - yc) + ' h ' + (options.hline + pxc - pnX0);
                line = options.oc_paper.path(path);
            } else { // subordinate
                if (typeof node.is_root == "undefined") {
                    path = 'M ' + xc + ' ' + yc + ' v -' + (options.vline + yc - nY0)+ ' h ' + (pxc - xc) + ' V ' + pyc;
                    line = options.oc_paper.path(path);
                }
            }
            line.attr('stroke', options.line_color);
            line.attr('stroke-width', 2);     // stroke-opacity works from stroke-width 1.8 and above
            line.attr('stroke-opacity', 1);   // opacity to 1 to disquise that lines are over each other
            line.attr('stroke-linejoin', "round");
        }

        // now draw the box
        //
        var box;
        if (typeof node.visible == "undefined" || node.visible === true) {
            box = options.oc_paper.rect(nX0, nY0, nX1 - nX0, nY1 - nY0, options.box_border_radius);
            box.attr('fill', node.subtype == 'dashed' ? options.dashed_box_color        : options.box_color        );
            if (node.subtype == 'dashed') { box.attr('stroke-dasharray', "-"); }
            box.attr('stroke', node.subtype == 'dashed' ? options.dashed_box_border_color : options.box_border_color );
            box.attr('stroke-width', options.box_border_width);
            box.visible = true;
        }
        else {
            box = { visible : false };
        }

        // draw optional images
        //
        var image;
        if (options.use_images && typeof node.image != "undefined") {
            if (typeof node.image_position != "undefined" && node.image_position == "above") {   // text below image
                image = options.oc_paper.image(options.images_base_url + node.image,
                    xc - options.images_size[0] / 2, nY0 + options.inner_padding,
                    options.images_size[0], options.images_size[1]);
            }
            else {   // text above image (default)
                image = options.oc_paper.image(options.images_base_url + node.image,
                    xc - options.images_size[0] / 2, nY1 - options.images_size[1] - options.inner_padding,
                    options.images_size[0], options.images_size[1]);
            }
        }

        // drawing of title and subtitle is left to the second branch of the following code
        // the first branch is for when the options.box_html_template is defined
        // the second branch is for when the options.box_html_template is not defined
        // TODO: add click event to nodes in the first branch
        //
        if (typeof options.box_html_template == "string") {
            var hBox = new htmlBox(options, options.oc_paper, { x: nX0, y: nY0, width: nX1 - nX0, height: nY1 - nY0 } );
            var template = jQuery("#" + options.box_html_template);
            if (template.length !== 0 && hBox.div !== null) {
                hBox.div.html(template.render(node));
            }
            // debug
            if (options.debug) {
                console.log('drawing ' + node.title + ' htmlBox: x=' + nX0 + ' y=' + nY0 + ' width=' + (nX1 - nX0) + ' height=' + (nY1 - nY0));
            }
            if (typeof (options.box_callback) == "function") {
                node.options = options;
                options.box_callback(box, hBox, node);
            }
        }
        else {
            if (typeof options.box_callback == "function") {
                options.box_callback(box);
            }
            if (typeof node.id != "undefined") {
                box.oc_id = node.id;
                box.oc_node = node;
            }
            var event_box_color_hover = node.subtype == 'dashed' ? options.dashed_box_color_hover : options.box_color_hover;
            var event_box_color       = node.subtype == 'dashed' ? options.dashed_box_color       : options.box_color;

            var title;
            var subtitle;
            // attach events to rectangle
            if (box.visible === true) {
                box.hover(
                    function () { this.attr( { fill: event_box_color_hover } ); },  // function(event)
                    function () { this.attr( { fill: event_box_color } );       }   // function(event)
                );
                if (options.box_click_handler !== null && typeof options.box_click_handler != "undefined")
                    box.click(function (event) { options.box_click_handler(event, box); });

                // draw node title and subtitle
                var title_ypos = nY0 + options.inner_padding
                    + node.title_lines * options.title_char_size[1] / 2
                    + (options.oc_max_title_lines - node.title_lines) * options.title_char_size[1] / 2
                    - 2;
                if ((options.use_images && typeof node.image != "undefined") && 
                    (typeof node.image_position != "undefined" && node.image_position == "above")) {   // text below image
                    title_ypos += options.images_size[1] + options.inner_padding;
                }
                title = options.oc_paper.text(xc, title_ypos, node.title);
                title.attr('font-family', options.text_font);
                title.attr('font-size', options.title_font_size);
                title.attr('fill', options.title_color);
                if (typeof node.subtitle != "undefined") {
                    var subtitle_ypos = nY1 - options.inner_padding
                        - node.subtitle_lines * options.subtitle_char_size[1] / 2;
                    if (options.use_images && typeof node.image != "undefined")
                        subtitle_ypos -= options.images_size[1] + options.inner_padding;
                    if ((options.use_images && typeof node.image != "undefined") &&
                        (typeof node.image_position != "undefined" && node.image_position == "above")) {   // text below image
                        subtitle_ypos += options.images_size[1] + options.inner_padding;
                    }
                    subtitle = options.oc_paper.text(xc, subtitle_ypos, node.subtitle);
                    subtitle.attr('font-family', options.text_font);
                    subtitle.attr('font-size', options.subtitle_font_size);
                    subtitle.attr('fill', options.subtitle_color);
                }
            }
            if (typeof options.box_finished_callback == "function") {
                options.box_finished_callback(box, title, subtitle, image);
            }
        }

        // debug
        //
        if (options.debug) {
            // draw the boundbox
            nX0 = xoffset + node.deltacorner[0] + node.xoffset + node.xoffset2;
            nX1 = xoffset + node.deltacorner[0] + node.xoffset + node.xoffset2 + node.boundbox[0];
            nY0 = yoffset + node.deltacorner[1];
            nY1 = yoffset + node.deltacorner[1] + node.boundbox[1];
            var boundbox = options.oc_paper.rect(nX0 + 8, nY0 + 8, nX1 - nX0 - 14, nY1 - nY0 - 12);
            boundbox.attr( { stroke: "#00f", "stroke-width": 0.4 } );
            // draw the fullbbox
            nX0 = xoffset + node.deltacorner[0];
            nX1 = xoffset + node.deltacorner[0] + node.fullbbox[0];
            nY0 = yoffset + node.deltacorner[1];
            nY1 = yoffset + node.deltacorner[1] + node.fullbbox[1];
            var fullbbox = options.oc_paper.rect(nX0 + 5, nY0 + 5, nX1 - nX0 - 8, nY1 - nY0 - 6);
            fullbbox.attr( { stroke: "#f00", "stroke-width": 0.4 } );
        }
    }



    // takes a raphaeljs object, some options, and some container attributes
    // http://rubyscale.com/blog/2010/11/22/embedding-arbitrary-html-into-raphaeljs/
    //
    function htmlBox (options, a_paper, other_options) {
        other_options = other_options || {};
        this.paper = a_paper;
        this.x = other_options.x || 0;
        this.y = other_options.y || 0;
        this.width  = other_options.width  || this.paper.width;
        this.height = other_options.height || this.paper.height;
        this.enableOffset = options.enableOffset || false;
        this.raphaelContainer = jQuery('#' + options.container);
        this.div = jQuery('<div style="position: absolute; width: 0; height: 0;" class="node"></div>').appendTo(this.raphaelContainer);
        this.update();
        // If you don't call ggOrgChart.render(...); in the window.load handler, 
        // then you should use following approach instead this.update();
        // - jQuery(document).bind('ready' , this, function(event) { event.data.update(); });
        // - jQuery(window).bind  ('resize', this, function(event) { event.data.update(); });
        // TODO: check .ready() vs .load() events
    }



    // prototypes used by the previuos function
    //
    htmlBox.prototype.update = function () {
        var offset = this.raphaelContainer.offset();
        if (! this.enableOffset)
            this.raphaelContainer.css( { 'position': 'relative' } );
        this.div.css( {
            'top'    : (this.y + (this.enableOffset ? offset.top  : 0)) + 'px',
            'left'   : (this.x + (this.enableOffset ? offset.left : 0)) + 'px',
            'height' : (this.height + 'px'),
            'width'  : (this.width  + 'px')
        } );
    };
    htmlBox.prototype.remove = function () {
        this.div.remove();
    };



    // prepare scale, zoom and print
    //
    function oc_zoom_print_prepare (options) {
        $('#'+options.pdf_canvas).hide();
        options.oc_zdp_zoom            = options.initial_zoom;
        oc_zdp_width                   = $("svg").width();
        oc_zdp_height                  = $("svg").height();
        options.oc_zdp_width_internal  = oc_zdp_width;
        options.oc_zdp_height_internal = oc_zdp_height;
        oc_zdp_width                  *= 0.76;
        oc_zdp_height                 *= 0.76;
        $("#"+options.container_supra).scrollLeft(options.oc_zdp_width_internal * options.oc_zdp_zoom / 2 - options.pdf_canvas_width / 2);
        $("#"+options.container).css('transform','scale('+options.oc_zdp_zoom+')');
        $("#"+options.container).width (options.pdf_canvas_width  / (options.oc_zdp_width_internal  * 100) );
        $("#"+options.container).height(options.pdf_canvas_height / (options.oc_zdp_height_internal * 100) );
        $("svg").css('background','#FFFFFF');
    }



    // call to zoom-in
    //
    function oc_zoom_in (options) {
        options.oc_zdp_zoom += 0.1;
        $("#"+options.container).css('transform','scale('+options.oc_zdp_zoom+')');
    }



    // call to zoom-out
    //
    function oc_zoom_out (options) {
        if (options.oc_zdp_zoom.toFixed(2) > 0.00) {
            options.oc_zdp_zoom -= 0.1;
            $("#"+options.container).css('transform','scale('+options.oc_zdp_zoom+')');
        }
    }



    // call to generate PDF
    //
    function oc_print (options) {
        var content = $("#"+options.container).html();
        if (navigator.appName == 'Microsoft Internet Explorer') {
            content = content.replace(
                /xmlns=\"http:\/\/www\.w3\.org\/2000\/svg\"/, ''
            );
            content = content.replace(
                /<defs \/>/, '<defs></defs><rect width="'+options.oc_zdp_width_internal+'" height="'+options.oc_zdp_height_internal+'" style="fill:rgb(255,255,255);"/>'
            );
        } else {
            var regexp = RegExp('<defs[^><]*>|<.defs[^><]*>','g');
            content = content.replace(regexp,
                '<rect width="'+options.oc_zdp_width_internal+'" height="'+options.oc_zdp_height_internal+'" style="fill:rgb(255,255,255);"/>'
            ); 
        }
        canvg(options.pdf_canvas, content, { ignoreMouse: true, ignoreAnimation: true } );
        var canvas = document.getElementById(options.pdf_canvas);
        var canvas_data = canvas.toDataURL("image/jpeg");
        var pdf_document = new jsPDF('landscape','pt','ggorgchart');
        pdf_document.addImage(canvas_data, 'JPEG', 8, 0, 0, 0);   // begin at x=8 in order to left space for lines of staffleft nodes
        pdf_document.save(options.pdf_filename);
    }



} ) (window);



// END OF LIBRARY
