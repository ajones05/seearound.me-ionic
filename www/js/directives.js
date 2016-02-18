angular.module('SeeAroundMe.directives', [])

.directive('postLikeBox', function () {
    return {
        restrict: 'E',
        template: '<span class="col arrows">'
              +'<img src="img/upvote_off.png" ng-if="post.isLikedByUser == 0" ng-click="upVote(post.id, 1)" alt="">'
              +'<img src="img/upvote_off.png" ng-if="post.isLikedByUser == -1" ng-click="upVote(post.id, 1)" alt="">'
              +'<img src="img/upvote_on.png" ng-if="post.isLikedByUser == 1" ng-click="upVote(post.id, -1)" alt="">'
              +'{{post.vote}}'
              +'<img src="img/downvote_on.png" ng-if="post.isLikedByUser == -1" ng-click="downVote(post.id, 1)" alt="">'
              +'<img src="img/downvote_off.png" ng-if="post.isLikedByUser == 1" ng-click="downVote(post.id, -1)" alt="">'
              +'<img src="img/downvote_off.png" ng-if="post.isLikedByUser == 0" ng-click="downVote(post.id, -1)" alt=""></span>',
        controller: function ($scope, AppService) {
              $scope.upVote = function(newsId , v){
                    console.log('V: ' + v);
                    // pass v => '1' for upvote
                    // and v=> '-1' for downvote
                    AppService.vote(newsId, v)
                    .then(function(response){
                          console.log(JSON.stringify(response));
                      if (response.data.reasonfailed){
                          console.log(JSON.stringify(response.data.message));
                      }else if (response.data.success){
                        $scope.nearbyPosts.map(function(post){
                          if (post.id === newsId){
                            post.vote = response.data.vote;
                            if(post.isLikedByUser == 1 && v == -1)//Cancel vote case
                                    post.isLikedByUser = 0;
                            else if(post.isLikedByUser == 0 && v == 1)
                                    post.isLikedByUser = 1;
                            else if(post.isLikedByUser == -1 && v == 1){
                                post.isLikedByUser = 0;
                                //Vote twice: one to cance negative vote and the other to vote plus
                                AppService.vote(newsId, v)
                                .then(function(response){
                                  console.log(JSON.stringify(response));
                                  if (response.data.reasonfailed){
                                      console.log(JSON.stringify(response.data.message));
                                  }else if (response.data.success){
                                       post.vote = response.data.vote;
                                      post.isLikedByUser = 1;
                                  }
                                });
                            }                                   
                          }
                        })
                      }

                    }, function(err){
                      console.log('error upvoting', JSON.stringify(err));
                    });
              };
            
              $scope.downVote = function(newsId , v){
                    console.log('V: ' + v);
                    // pass v => '1' for upvote
                    // and v=> '-1' for downvote
                    AppService.vote(newsId, v)
                    .then(function(response){
                          console.log(JSON.stringify(response));
                      if (response.data.reasonfailed){
                          console.log(JSON.stringify(response.data.message));
                      }else if (response.data.success){
                        $scope.nearbyPosts.map(function(post){
                          if (post.id === newsId){
                            post.vote = response.data.vote;
                            if(post.isLikedByUser == 0 && v == -1)
                                    post.isLikedByUser = -1;
                            else if(post.isLikedByUser == -1 && v == 1)
                                    post.isLikedByUser = 0;
                            else if(post.isLikedByUser == 1 && v == -1){
                                post.isLikedByUser = 0;
                                //Vote twice: one to cancel positive vote and the other to vote negative
                                AppService.vote(newsId, v)
                                .then(function(response){
                                  console.log(JSON.stringify(response));
                                  if (response.data.reasonfailed){
                                      console.log(JSON.stringify(response.data.message));
                                  }else if (response.data.success){
                                       post.vote = response.data.vote;
                                       post.isLikedByUser = -1;
                                  }
                                });                                
                            }
                          }
                        })
                      }

                    }, function(err){
                      console.log('error upvoting', JSON.stringify(err));
                    });
              }
            
        }
    }
})

.directive('focusMe', function($timeout) {
  return {
    link: function(scope, element, attrs) {

      $timeout(function() {
        element[0].focus(); 
      });
    }
  };
});
