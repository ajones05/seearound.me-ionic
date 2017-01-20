angular.module('SeeAroundMe.filters', [])

.filter('hashtag', function($sce, $sanitize) {
        
    return function(text) {
        var regex = /(^|[^&])#([A-Za-z0-9_-]+)(?![A-Za-z0-9_\]-])/g;
        //console.log('=============================== hashtag filter =================================');
        //console.log(text);
        var newHtml = $sanitize(text).replace(regex, "$1<a class=\"hashtag\" onClick=\"tagTermClick();return false;\">#$2</a>");
        //console.log('========== newHtml ========');
        //console.log(newHtml);
        return $sce.trustAsHtml(newHtml);
    }
})

.filter('hrefToJS', function ($sce, $sanitize) {
    return function (text) {
        var regex = /href="([\S]+)"/g;
        var newString = $sanitize(text).replace(regex, "href onClick=\"window.open('$1', '_blank', 'location=yes');return false;\"");

        return $sce.trustAsHtml(newString);
    }
})

filter('trust', function($sce, $sanitize) {
  return function(htmlCode){
    return $sce.trustAsHtml(htmlCode);
  };
})

.filter('samDate', function ($filter){
  return function(d){
    
    return $filter('date')(d, "dd-MM-yyyy");
  }
});
