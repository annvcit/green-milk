(function() {
    'use strict';

    angular
        .module('users.admin')
        .controller('UserManagementController', UserManagementController);
    
    UserManagementController.$inject = ['AdminUserService', '$scope'];

    function UserManagementController(AdminUserService, $scope) {
        var vm = this;

        activate();

        ///////////////

        function activate() {
            initUserObject();
            initRoleButtons();

            vm.addUserButtonLabel = 'Thêm người dùng';
            vm.usernameLabel = 'Tên người dùng';
            vm.usernamePlaceholder = 'username. Ví dụ: trant123, tranguyen';
            vm.displayNameLabel = 'Họ và tên';
            vm.displayNamePlaceholder = 'Ví dụ: Nguyễn Văn ABC';
            vm.providerLabel = 'Loại đăng kí';
            vm.roleLabel = 'Quyền';
            vm.saveLabel = 'Lưu';
            vm.cancelLabel = 'Hủy';
            vm.isCollapse = true;
            vm.addressLabel = 'Địa chỉ';


            vm.gridOptions = {
                enableFiltering: true,
                columnDefs: [
                     { field: 'index', displayName: '#', width: '5%', cellTemplate: '<div class="ui-grid-cell-contents">{{grid.renderContainers.body.visibleRowCache.indexOf(row) + 1}}</div>', enableFiltering: false, enableSorting: false },
                     { field: 'displayName', width: '20%', displayName: 'Họ và tên', cellTemplate: '<div class="ui-grid-cell-contents" popover-trigger="outsideClick" popover-title="Họ và tên" popover-append-to-body="true" uib-popover="{{ COL_FIELD }}">{{ COL_FIELD }}<div>' },
                     { field: 'created', displayName: 'Ngày đăng kí', cellTemplate: '<div class="ui-grid-cell-contents">{{ COL_FIELD | date : "dd/MM/yyyy" : "+7" }}</div>' },
                     { field: 'provider', displayName: 'Loại đăng kí' },
                     { field: 'roles', displayName: 'Quyền', cellTemplate: '<div class="ui-grid-cell-contents"  popover-trigger="outsideClick" popover-title="Quyền" popover-append-to-body="true" uib-popover=\'{{ row.entity.roles.join(", ") }}\'>{{ row.entity.roles.join(", ") }}</div>' },
                     { field: 'address', displayName: 'Địa chỉ', cellTemplate: '<div class="ui-grid-cell-contents" popover-trigger="outsideClick" popover-title="Địa chỉ" popover-append-to-body="true" uib-popover="{{ COL_FIELD }}">{{ COL_FIELD }}<div>'},
                     { field: 'options', displayName: 'Chức năng', cellTemplate: '<div class="ui-grid-cell-contents">them xoa sua blah blah</div>', enableFiltering: false, enableSorting: false },
                ],
                data: AdminUserService.query()
            }; // end vm.gridOptions
        }

        function initUserObject() {
            vm.user = {
                provider: 'local',
                roles: []
            };
        }

        function initRoleButtons() {
            vm.userLabel = 'user';
            vm.adminLabel = 'admin';
            vm.sellerLabel = 'seller';

            vm.roles = {
                user: true,
                admin: false,
                seller: false
            };

            $scope.$watchCollection('vm.roles', function() {
                vm.user.roles = [];
                angular.forEach(vm.roles, function(value, key) {
                    if (value) {
                        vm.user.roles.push(key);
                    }
                });
            });

        }
    }
}());