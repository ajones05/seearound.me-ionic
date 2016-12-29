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
            
              $scope.updateUpVote = function(post, myVote, newsId){
                    
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
                        post.vote = parseInt(post.vote) + 2;
                    };  
                  
                      if(post.canVote == 1){
                            AppService.vote(newsId, myVote)
                            .then(function(response){

                              if (response.data.reasonfailed){
                                  //console.log(JSON.stringify(response.data.message));
                              }else if (response.data.success){
                                  //console.log(JSON.stringify(response));
                              }

                            }, function(err){
                              //console.log('error upvoting', JSON.stringify(err));
                            });
                      }                  
              };
            
              $scope.updateDownVote = function(post, myVote, newsId){
                    
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
                        post.vote = parseInt(post.vote) - 2;
                        //Vote twice: one to cancel positive vote and the other to vote negative
                        //AppService.vote(post.id, myVote)
                            //.then(function(response){
                              //console.log(JSON.stringify(response));
                            //});
                    }
                  
                      if(post.canVote == 1){
                            AppService.vote(newsId, myVote)
                            .then(function(response){

                              if (response.data.reasonfailed){
                                  //console.log(JSON.stringify(response.data.message));
                              }else if (response.data.success){
                                  //console.log(JSON.stringify(response));
                              }

                            }, function(err){
                              //console.log('error upvoting', JSON.stringify(err));
                            });
                      }                  
              };            
            
              $scope.upVote = function(newsId , v){
                    //console.log('V: ' + v);
                    // pass v => '1' for upvote
                    // and v=> '-1' for downvote
                    if($scope.nearbyPosts && $scope.nearbyPosts.map){//List view case
                            $scope.nearbyPosts.map(function(post){
                              if (post.canVote == 1 && post.id === newsId){
                                  $scope.updateUpVote(post, v, newsId);
                              }
                            });                              
                      }
                      else if($scope.post && $scope.post.canVote == 1){//Map modal view case
                          $scope.updateUpVote($scope.post, v, newsId);
                      }
              };
            
              $scope.downVote = function(newsId , v){
                    console.log('V: ' + v);
                    // pass v => '1' for upvote
                    // and v=> '-1' for downvote
                      if($scope.nearbyPosts && $scope.nearbyPosts.map){//List view case
                            $scope.nearbyPosts.map(function(post){
                              if (post.canVote == 1 && post.id === newsId){
                                  $scope.updateDownVote(post, v, newsId);
                              }
                            });                              
                      }
                      else if($scope.post && $scope.post.canVote == 1){//Map modal view case
                          $scope.updateDownVote($scope.post, v, newsId);
                      }                                            
              }            
        }
    }
})

.directive('postActions', function () {
    return {
        restrict: 'E',
        template: '<span class="post-actions" ng-click="openMenu(post)"><i class="icon ion-more"></i></span>',
        scope:{
            post:'=',
            from:'@'
        },
        controller: function ($scope, $rootScope, $state, $ionicModal, $ionicPopup, AppService, MapService) {
            
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
                            if($scope.from == 'map'){
                                $rootScope.$broadcast('hidemapmodal'); 
                                MapService.refreshMap();
                            }

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
                
                if($scope.from == 'map'){
                    post.from = 'map';
                }
                
                //if(post.link_url){
                    //post.news = post.news + '\n' + post.link_url;
                //}
                
                $state.go('editpostview', post);
            };
            
            $scope.sharePost = function(post){
                $scope.hideMenuModal();
                //var sanitizedText = $sanitize(text);
                var link = 'http://www.seearound.me/post/' + post.id;
                window.plugins.socialsharing.share( null, null, null,link);                
            };
            
            $scope.followUser = function(post){
                $scope.hideMenuModal();
                AppService.followUser(post.user_id).then(function(result){
                      if(result.data.status == 'SUCCESS')
                        post.isFriend = 1;
                      //console.log(JSON.stringify(result));
                });                
            };            
            
            $scope.unfollowUser = function(post){
                $scope.hideMenuModal();
                AppService.unfollowUser(post.user_id).then(function(result){
                      if(result.data.status == 'SUCCESS')
                        post.isFriend = 0;
                      //console.log(JSON.stringify(result));
                });                
            };                        
            
            $scope.viewProfile = function(post){
                $scope.hideMenuModal();
                //console.log('goto profile called with id= ', post.user_id);
                var userData = JSON.parse(localStorage.getItem('sam_user_data')) || {};
                var userId = userData.id || 0;
                if(userId == post.user_id){
                    AppService.setIsCurrentUserFlag(true);
                }
                else{
                    AppService.setIsCurrentUserFlag(false);
                }

                AppService.setUserForProfilePage(post.user_id)
                .then(function(){
                  $state.go('app.userprofile');
                });                
            };
            
            $scope.blockUser = function(post){
                $scope.hideMenuModal();
                AppService.blockUser(post).then(function(result){
                    //console.log(result);
                    if(result.data.status == 'SUCCESS'){
                        AppService.showErrorAlert('User Blocked', post.Name + ' has been blocked. You will no longer see their posts.');
                    }
                });                 
            };  
            
            $scope.flagPost = function(post){
                
                $scope.hideMenuModal();
                AppService.flagPost(post).then(function(result){
                    //console.log(result);
                    if(result.data.status == 'SUCCESS'){
                        AppService.showErrorAlert('Post Flagged', 'This post has been flagged for review.');
                    }
                });                
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
})

.directive('hashtagify', ['$timeout', '$compile',
    function($timeout, $compile) {
        return {
            restrict: 'A',
            scope: {
                uClick: '&userClick',
                tClick: '&termClick'
            },
            link: function(scope, element, attrs) {
                $timeout(function() {
                    var html = element.html();

                    if (html === '') {
                        return false;
                    }

                    if (attrs.userClick) {
                        html = html.replace(/(|\s)*@(\w+)/g, '$1<a ng-click="uClick({$event: $event})" class="hashtag">@$2</a>'); 
                    }
                    
                    if (attrs.termClick) {
                        html = html.replace(/(^|\s)*#(\w+)/g, '$1<a ng-click="tClick({$event: $event})" class="hashtag">#$2</a>');
                    }

                    element.html(html);
                    
                    $compile(element.contents())(scope);
                }, 0);
            }
        };
    }
]);