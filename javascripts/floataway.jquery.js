(function($){
    $.fn.floatAway = function() {  
        return this.each(function() {
                var that = $(this);
        	that.animate({
	        		'margin-left': '40px',
	        		'margin-top': '-60px',
	        		'opacity': 0.3
	        	}, 1500, 'linear', function() {
        			that.remove();
        		}
        	);
        });
    };
})( jQuery );