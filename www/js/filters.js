angular.module('SeeAroundMe.filters', [])

.filter('hrefToJS', function ($sce, $sanitize) {
    return function (text) {
        var regex = /href="([\S]+)"/g;
        var newString = $sanitize(text).replace(regex, "href onClick=\"window.open('$1', '_blank', 'location=yes');return false;\"");

        return $sce.trustAsHtml(newString);
    }
})

.filter('samDate', function ($filter){
  return function(d){
    
    return $filter('date')(d, "dd-MM-yyyy");
  }
});
