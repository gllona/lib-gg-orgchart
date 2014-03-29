/**
 * jQuery.Drag-On v2.5.2
 * @author Dark Heart aka PretorDH
 * @site dragon.deparadox.com
 * MIT license
 */

$(function () {

   $.fn.extend({
        dragOn: function (opt) {
            return jQuery.DragOn(this, opt);
        }
    });

    $.extend({
        DragOn: function (S, opt) { /* Scroll mechanics */
            var def = {
            	exclusion : {'input': '', 'textarea': '', 'select': '', 'object':'' , 'iframe':'' , 'id':'#gmap,#map-canvas'},
            	cursor : 'all-scroll',
            	easing : 'true'
            },Sd;
            
            function onPrevent(E) {
                var e = E || event, et = (e && e.target && (e.target.tagName || e.target.localName || e.target.nodeName).toLowerCase());
                return e && et && (et in Sd.opt.exclusion || (e.target.href || $(e.target).parents().attr('href') && (e.stopPropagation && e.stopPropagation(), true)))
				   || (e && e.preventDefault && e.preventDefault(), e.stopPropagation && e.stopPropagation(), false);
            };

            Sd = (S = $(S)).DragOn = {
            	opt: (function (opt) {for (var b in opt) def[b]=opt[b]; return def;})(opt),
            	moment: {},
            	x: 1,
            	y: 1,
            	on:true,
            	toggle: function(e) {
            		if (Sd.on) {
			            S.css({ cursor: Sd.opt.cursor }).children('a').on('mousedown',onPrevent).css({ cursor: 'pointer' });
			            S.on({'mousewheel wheel':Sd.onWhell,'mousedown':Sd.onHold});
			            $('body').on({'keydown':Sd.onKeyDown,'keyup':Sd.onKeyDown});
			        } else {
			            S.css({ cursor: '' }).children('a').off('mousedown',onPrevent).css({ cursor: '' });
			            S.off({'mousewheel wheel':Sd.onWhell,'mousedown':Sd.onHold});
			            $('body').off({'keydown':Sd.onKeyDown,'keyup':Sd.onKeyDown});
			        }
			        Sd.on=!Sd.on;
			        if (e!=null) S.trigger('BarOn.toggle');
			        return false;
            	},
                getCurPos: function () {
                    var a, b, c, to = S.to;
                    return S.curPos = {
                        't': a = to.scrollTop(),
                        'ph': b = to.innerHeight(),
                        'maxY': b = to[0].scrollHeight - b,
                        'l': a = to.scrollLeft(),
                        'pw': b = to.innerWidth(),
                        'maxX': b = to[0].scrollWidth - b
                    }
                },
                setCurPos: function (dx, dy) {
                    var t, l, cp, ddy, ddx;
                    do {
                    	S.to = Sd.scrollParent(S.to);
                        cp = Sd.getCurPos();
                        (cp.maxY > 0) && (Math.abs(dy) > Math.abs(dx))
							&& ((cp.maxX > 0) || (dx = 0), ddy = (cp.t - (ddy = Math.round((cp.maxY / cp.ph + 1) * dy)) < 0) ? cp.t : (cp.t - ddy > cp.maxY ? cp.t - cp.maxY : ddy))
							&& S.to.scrollTop(cp.t - ddy), (t = S.to.scrollTop() != cp.t) && (dy = 0,S.to.trigger('scroll'));
                        (cp.maxX > 0) && (Math.abs(dx) > Math.abs(dy))
							&& (dy = 0, ddx = (cp.l - (ddx = Math.round((cp.maxX / cp.pw + 1) * dx)) < 0) ? cp.l : (cp.l - ddx > cp.maxX ? cp.l - cp.maxX : ddx))
							&& S.to.scrollLeft(cp.l - ddx), (l = S.to.scrollLeft() != cp.l) && (dx = 0,S.to.trigger('scroll'));
                    } while ((S.to.data('overflow') == 'no-dragon'
								|| S.to[0].tagName.toLowerCase() == 'a'
								|| !(dy && t) && !(dx && l))
							&& S[0] != S.to[0]
							&& (S.to = S.to.parent()));
                },
                scrollParent : function(Sto) {
					while ((Sto[0].nodeType != 1 || Sto.css('overflow')=='visible') || Sto.data('overflow')=='no-dragon' && S[0]!=Sto[0] ) Sto=Sto.parent();
					return Sto;
                },

                onWhell: function (e, delta) { //for horizontal scroll
                    Sd.moment={};
                    var SSto,cp,st,ot,t,l,ph,pw,et,ad
                    	E = e.originalEvent;     
					Sd.x = 1; Sd.y = 1;
                    S.to = $((this === e.target) ? this : e.target);

                    delta = (delta || E.wheelDelta || E.wheelDeltaY || E.wheelDeltaX ) >> 1;
                    delta = delta || (-(E.deltaX || E.deltaY || E.deltaZ)<<(E.deltaMode && E.deltaMode<<2)<<1);
                    ad=Math.abs(delta>>1);

                    do {
	                    S.to = Sd.scrollParent(S.to);
                        S.too=(SSto = S.to[0]!=S[0])?Sd.scrollParent(S.to.parent()):S;

                        cp = Sd.getCurPos();                        
                		st=S.to.offset();				ot=S.too.offset();
                		t=st.top-ot.top;				l=st.left-ot.left;
                		ph=S.too.innerHeight()-cp.ph;	pw=S.too.innerWidth()-cp.pw;
                    		
                    	if  ( (ph>=0 && -ad<=t && t<=ph+ad || ph<=0 && ad>=t && t>=ph-ad) && (pw>=0 && -ad<=l && l<=pw+ad || pw<=0 && ad>=l && l>=pw-ad) ){
	                        if (cp.maxY > 0) {
                        		S.to.scrollTop(t = (t = cp.t - delta) > 0 ? (t > cp.maxY ? cp.maxY : t) : 0);
                        		if ( S.to.scrollTop()!=cp.t ) (e.preventDefault(),e.stopPropagation(),S.to.trigger('scroll',[false,false]),delta=0);
                        	};
	                        if (delta && cp.maxX > 0) {
                        		S.to.scrollLeft(t = (t = cp.l - delta) > 0 ? (t > cp.maxX ? cp.maxX : t) : 0);
                        		if ( S.to.scrollLeft()!=cp.l ) (e.preventDefault(),e.stopPropagation(),S.to.trigger('scroll',[true,true]),delta=0);
                        	};
                        };
                        
                    } while (delta!=0 && SSto && (S.to=S.to.parent()) );
                    return this;
                },
                onHold: function (e) {        
                    Sd.moment={};
                    var b,et = (e.target.tagName || e.target.localName || e.target.nodeName).toLowerCase();
                    if (et in Sd.opt.exclusion) return;
                  
                    S.too = S.to = $((this === e.target) ? this : e.target);
                    if (S.too.parents(Sd.opt.exclusion.id).length) return;
                    
                    (e.type == 'mousedown') && (e.preventDefault(), e.stopPropagation());
                    Sd.x=S.to.hasClass('bBarOn')?-1:1;
                    Sd.y=S.to.hasClass('rBarOn')?-1:1;
					
					Sd.moment = S.holdPos = { 'x': e.pageX, 'y': e.pageY };
					Sd.moment.startTime=+new Date();
                    S.on({'mousemove':Sd.onDragg,'mouseleave mouseup':Sd.onRelease});
                    S.too.on('mouseup', Sd.onRelease);

                    Sd.noButtonHold = false;
                    (Sd.SAH = S.too).on('scroll', Sd.onScrollAfterHold);
                },
                onScrollAfterHold: function (e) {
                	Sd.moment = {};
                    Sd.noButtonHold = true;
                    Sd.SAH.off('scroll', Sd.onScrollAfterHold);
                },
                onDragg: function (e) {
                    Sd.SAH && (Sd.SAH.off('scroll', Sd.onScrollAfterHold), Sd.SAH = null);
                    var x = e.pageX, y = e.pageY,
					dx = x - S.holdPos.x; dy = y - S.holdPos.y;
                    S.to = $((this === e.target) ? this : e.target);
                    
                    if (Sd.noButtonHold || !(e.which + e.button)) return Sd.onRelease(e);
                    e.preventDefault(); e.stopPropagation();

                    S.holdPos = { 'x': x, 'y': y };
                    Sd.setCurPos(dx*Sd.x, dy*Sd.y);
                    return true;
                },
                onRelease: function (e) {
                	var sm;
                	Sd.opt.easing && (sm=Sd.moment) &&
                		(sm.vector={y:e.pageY-sm.y,x:e.pageX-sm.x},
                		 sm.snatch=(+new Date()-sm.startTime),
                		 sm.speedX=((sm.vector.x>0)?1:-1)*sm.vector.x*sm.vector.x/(2*sm.snatch),
                		 sm.speedY=((sm.vector.y>0)?1:-1)*sm.vector.y*sm.vector.y/(2*sm.snatch),
                		 (sm.snatch<350)&&(sm.ORE=setTimeout(Sd.onReleaseEasing,10)));
                
                    if (e.type in { 'mouseup': '', 'mouseleave': '' }) (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation());
                    Sd.SAH && (Sd.SAH.off('scroll', Sd.onScrollAfterHold), Sd.SAH = null);
                    S.off({'mouseleave mouseup':Sd.onRelease,'mousemove':Sd.onDragg});
                    S.too && S.too.off('mouseup', Sd.onRelease);
                    return true;
                },
                onReleaseEasing: function (e) {
                	var sm;
                	if (!(sm=Sd.moment)) return;
                	
                    S.to=S.too;
                    Sd.setCurPos(Sd.x*(sm.speedX*=0.98), Sd.y*(sm.speedY*=0.98));
                    sm.ORE=(Math.round(sm.speedX)||Math.round(sm.speedY))?setTimeout(Sd.onReleaseEasing,10):null;
                },
                onKeyDown: function (e) {
                	var	so,to,too,ek=e.which,sm=Sd.moment,wh=$(window).innerHeight();
               	
                	sm.speedX = (ek in {37:0,100:0}?2:(ek in {39:0,102:0}?-2:0 ) );
                	sm.speedY = (ek in {38:0,104:0}?1:(ek in {40:0,98:0}?-1:(ek in {33:0,105:0}? (so=Math.sqrt(Math.sqrt(wh)))*Math.sqrt(so/3)-4 :(ek in {34:0,99:0}? -(so=Math.sqrt(Math.sqrt(wh)))*Math.sqrt(so/3)+4 :(ek in {35:0,97:0}?-88:(ek in {36:0,103:0}?88:0) ) ) ) ) );
                	if (!(sm.speedX||sm.speedY) || Math.abs(sm.speedY)>15 && e.type=='keydown' || Math.abs(sm.speedY)<15 && e.type=='keyup') return;                	

					if (sm.key!=ek) {
	                	sm.key=ek;
	                	to = too = $(S);
						while (to.length && 
							    !( sm.speedY && ( to[0].scrollHeight-to.innerHeight()>2
									&& (so=to.offset()).left<=(ek=$(window).innerWidth ()-to.innerWidth()) 
									&& (so.left>=0 || ek<0 && so.left>=ek) )
								|| sm.speedX && ( to[0].scrollWidth -to.innerWidth() >2 
									&& (so=to.offset()).top <=(ek=wh-to.innerHeight()) 
									&& (so.top >=0 || ek<0 && so.top >=ek) )
								)) 
						(to=to.slice(1)).length || (to=too=too.children());
	                	S.too = to.eq(0);
                	};                	
                	             	               	
					Sd.onReleaseEasing();
					e.preventDefault(); e.stopPropagation();
                }
            };
					
            S.on({'DragOn.toggle':Sd.toggle,'DragOn.remove':function(){Sd.on||Sd.toggle();Bo=null;S.off('DragOn.toggle DragOn.remove')}});
            Sd.toggle();
			
            (("Info" in window) && Info||console).log('DragOn fly...');
            return Sd;
        }
    });

    $('.dragon').dragOn()
});