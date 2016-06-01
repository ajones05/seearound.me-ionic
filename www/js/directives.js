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
            
              $scope.updateUpVote = function(post, myVote){
                    
                    if(post.isLikedByUser == 1 && myVote == -1){//Cancel vote case
                            post.isLikedByUser = 0;
                            post.vote--;
                    }
                    else if(post.isLikedByUser == 0 && myVote == 1){
                            post.isLikedByUser = 1;
                            post.vote++;
                    }
                    else if(post.isLikedByUser == -1 && myVote == 1){
                        post.isLikedByUser = 1;
                        post.vote = post.vote + 2;
                        
                        //Vote twice: one to cancel negative vote and the other to vote plus
                        //AppService.vote(post.id, myVote)
                        //.then(function(response){
                          //console.log(JSON.stringify(response));
                        //});
                    };                  
              };
            
              $scope.updateDownVote = function(post, myVote, totalVote){
                    
                    if(post.isLikedByUser == 0 && myVote == -1){
                            post.isLikedByUser = -1;
                            post.vote--;
                    }
                    else if(post.isLikedByUser == -1 && myVote == 1){//Cancel vote
                            post.isLikedByUser = 0;
                            post.vote++;
                    }
                    else if(post.isLikedByUser == 1 && myVote == -1){
                        post.isLikedByUser = -1;
                        post.vote = post.vote - 2;
                        //Vote twice: one to cancel positive vote and the other to vote negative
                        //AppService.vote(post.id, myVote)
                            //.then(function(response){
                              //console.log(JSON.stringify(response));
                            //});
                    }
              };            
            
              $scope.upVote = function(newsId , v){
                    //console.log('V: ' + v);
                    // pass v => '1' for upvote
                    // and v=> '-1' for downvote
                    if($scope.nearbyPosts.map){//List view case
                            $scope.nearbyPosts.map(function(post){
                              if (post.id === newsId){
                                  $scope.updateUpVote(post, v);
                              }
                            });                              
                      }
                      else{//Map modal view case
                          $scope.updateUpVote($scope.post, v);
                      }

                    AppService.vote(newsId, v)
                    .then(function(response){
                          
                      if (response.data.reasonfailed){
                          console.log(JSON.stringify(response.data.message));
                      }else if (response.data.success){
                          console.log(JSON.stringify(response));
                      }

                    }, function(err){
                      console.log('error upvoting', JSON.stringify(err));
                    });
              };
            
              $scope.downVote = function(newsId , v){
                    console.log('V: ' + v);
                    // pass v => '1' for upvote
                    // and v=> '-1' for downvote
                      if($scope.nearbyPosts.map){//List view case
                            $scope.nearbyPosts.map(function(post){
                              if (post.id === newsId){
                                  $scope.updateDownVote(post, v);
                              }
                            });                              
                      }
                      else{//Map modal view case
                          $scope.updateDownVote($scope.post, v);
                      }                          
                  
                    AppService.vote(newsId, v)
                    .then(function(response){
                          
                      if (response.data.reasonfailed){
                          console.log(JSON.stringify(response.data.message));
                      }else if (response.data.success){
                          console.log(JSON.stringify(response));
                      }

                    }, function(err){
                      console.log('error upvoting', JSON.stringify(err));
                    });
              }            
        }
    }
})

.directive('postEdit', function () {
    return {
        restrict: 'E',
        template: '<span class="col" style="padding-left:60px;" ng-click="openMenu(post)"> Edit</span>',
        scope:{
            post:'=',
            from:'@'
        },
        controller: function ($scope, $rootScope, $state, $ionicModal, $ionicPopup, AppService) {
            
            $scope.openMenu = function(post){
                //$scope.post = post;
                //console.log('openMenu called ...');
                $scope.menuModal = null;
                                

                // Create the edit modal 
                $ionicModal.fromTemplateUrl('templates/post/edit-post-options.html',{
                    scope: $scope,
                    animation: 'fade-in'
                })
                    .then(function(modal) {
                        $scope.menuModal = modal;
                        modal.show();
                    });
            };
            
            $scope.deletePost = function(post){
                //console.log('deletePost called ...');
                //console.log(JSON.stringify(post));
                $scope.hideMenuModal();
                
                $ionicPopup.confirm({
                    title: 'See Around Me Alert',
                    template: 'Are you sure you want to delete this post?',
                    cancelText: 'No',
                    okText: 'Yes'
               }).then(function(res) {
                 if(res) {
                        $rootScope.currentPosts.splice($rootScope.currentPosts.indexOf(post), 1);
                        AppService.deletePost(post).then(function(){
                            console.log('Post deleted successfully');
                            //if($scope.from == 'comments'){
                               //$state.go('app.postlistview'); 
                            //}
                        });
                 } 
               });
            };
            
            $scope.editPost = function(post){
                //console.log('editPost called ...');
                //console.log(JSON.stringify(post));
                $scope.hideMenuModal();
                //Set post mode to edit
                $rootScope.postMode = 'edit';
                
                if($scope.from == 'map'){
                    post.from = 'map';
                }
                
                $state.go('editpostview', post);
            };

            $scope.hideMenuModal = function(){
               $scope.menuModal.hide();
            }; 
            
            $scope.$on('$destroy', function () {
                if($scope.menuModal)
                    $scope.menuModal.remove();
            });
        }
    };
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