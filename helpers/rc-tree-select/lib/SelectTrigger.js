'use strict';

exports.__esModule = true;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _rcTrigger = require('rc-trigger');

var _rcTrigger2 = _interopRequireDefault(_rcTrigger);

var _rcTree = require('rc-tree');

var _rcTree2 = _interopRequireDefault(_rcTree);

var _util = require('./util');

var _toArray = require('rc-util/lib/Children/toArray');

var _toArray2 = _interopRequireDefault(_toArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var BUILT_IN_PLACEMENTS = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: {
      adjustX: 0,
      adjustY: 1
    }
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1
    }
  }
};

var SelectTrigger = function (_Component) {
  (0, _inherits3['default'])(SelectTrigger, _Component);

  function SelectTrigger() {
    var _temp, _this, _ret;

    (0, _classCallCheck3['default'])(this, SelectTrigger);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = (0, _possibleConstructorReturn3['default'])(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.state = {
      _expandedKeys: [],
      fireOnExpand: false,
      dropdownWidth: null
    }, _this.onExpand = function (expandedKeys) {
      // rerender
      _this.setState({
        _expandedKeys: expandedKeys,
        fireOnExpand: true
      }, function () {
        // Fix https://github.com/ant-design/ant-design/issues/5689
        if (_this.trigger && _this.trigger.forcePopupAlign) {
          _this.trigger.forcePopupAlign();
        }
      });
    }, _this.highlightTreeNode = function (treeNode) {
      var props = _this.props;
      var filterVal = treeNode.props[(0, _util.labelCompatible)(props.treeNodeFilterProp)];
      if (typeof filterVal === 'string') {
        return props.inputValue && filterVal.indexOf(props.inputValue) > -1;
      }
      return false;
    }, _this.filterTreeNode = function (input, child) {
      if (!input) {
        return true;
      }
      var filterTreeNode = _this.props.filterTreeNode;
      if (!filterTreeNode) {
        return true;
      }
      if (child.props.disabled) {
        return false;
      }
      return filterTreeNode.call(_this, input, child);
    }, _temp), (0, _possibleConstructorReturn3['default'])(_this, _ret);
  }

  SelectTrigger.prototype.componentDidMount = function componentDidMount() {
    this.setDropdownWidth();
  };

  SelectTrigger.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    if (nextProps.inputValue && nextProps.inputValue !== this.props.inputValue) {
      // set autoExpandParent to true
      this.setState({
        _expandedKeys: [],
        fireOnExpand: false
      });
    }
  };

  SelectTrigger.prototype.componentDidUpdate = function componentDidUpdate() {
    this.setDropdownWidth();
  };

  SelectTrigger.prototype.setDropdownWidth = function setDropdownWidth() {
    var width = _reactDom2['default'].findDOMNode(this).offsetWidth;
    if (width !== this.state.dropdownWidth) {
      this.setState({ dropdownWidth: width });
    }
  };

  SelectTrigger.prototype.getPopupEleRefs = function getPopupEleRefs() {
    return this.popupEle;
  };

  SelectTrigger.prototype.getPopupDOMNode = function getPopupDOMNode() {
    return this.trigger.getPopupDomNode();
  };

  SelectTrigger.prototype.getDropdownTransitionName = function getDropdownTransitionName() {
    var props = this.props;
    var transitionName = props.transitionName;
    if (!transitionName && props.animation) {
      transitionName = this.getDropdownPrefixCls() + '-' + props.animation;
    }
    return transitionName;
  };

  SelectTrigger.prototype.getDropdownPrefixCls = function getDropdownPrefixCls() {
    return this.props.prefixCls + '-dropdown';
  };

  SelectTrigger.prototype.processTreeNode = function processTreeNode(treeNodes) {
    var _this2 = this;

    var filterPoss = [];
    this._expandedKeys = [];
    (0, _util.loopAllChildren)(treeNodes, function (child, index, pos) {
      if (_this2.filterTreeNode(_this2.props.inputValue, child)) {
        filterPoss.push(pos);
        _this2._expandedKeys.push(child.key);
      }
    });

    // Include the filtered nodes's ancestral nodes.
    var processedPoss = [];
    filterPoss.forEach(function (pos) {
      var arr = pos.split('-');
      arr.reduce(function (pre, cur) {
        var res = pre + '-' + cur;
        if (processedPoss.indexOf(res) < 0) {
          processedPoss.push(res);
        }
        return res;
      });
    });
    var filterNodesPositions = [];
    (0, _util.loopAllChildren)(treeNodes, function (child, index, pos) {
      if (processedPoss.indexOf(pos) > -1) {
        filterNodesPositions.push({ node: child, pos: pos });
      }
    });

    var hierarchyNodes = (0, _util.flatToHierarchy)(filterNodesPositions);

    var recursive = function recursive(children) {
      return children.map(function (child) {
        if (child.children) {
          return _react2['default'].cloneElement(child.node, {}, recursive(child.children));
        }
        return child.node;
      });
    };
    return recursive(hierarchyNodes);
  };

  SelectTrigger.prototype.renderTree = function renderTree(keys, halfCheckedKeys, newTreeNodes, multiple) {
    var props = this.props;

    var trProps = {
      multiple: multiple,
      prefixCls: props.prefixCls + '-tree',
      showIcon: props.treeIcon,
      showLine: props.treeLine,
      defaultExpandAll: props.treeDefaultExpandAll,
      defaultExpandedKeys: props.treeDefaultExpandedKeys,
      filterTreeNode: this.highlightTreeNode
    };

    if (props.treeCheckable) {
      trProps.selectable = false;
      trProps.checkable = props.treeCheckable;
      trProps.onCheck = props.onSelect;
      trProps.checkStrictly = props.treeCheckStrictly;
      if (props.inputValue) {
        // enable checkStrictly when search tree.
        trProps.checkStrictly = true;
      } else {
        trProps._treeNodesStates = props._treeNodesStates;
      }
      if (trProps.treeCheckStrictly && halfCheckedKeys.length) {
        trProps.checkedKeys = { checked: keys, halfChecked: halfCheckedKeys };
      } else {
        trProps.checkedKeys = keys;
      }
    } else {
      trProps.selectedKeys = keys;
      trProps.onSelect = props.onSelect;
    }

    // expand keys
    if (!trProps.defaultExpandAll && !trProps.defaultExpandedKeys && !props.loadData) {
      trProps.expandedKeys = keys;
    }
    trProps.autoExpandParent = true;
    trProps.onExpand = this.onExpand;
    if (this._expandedKeys && this._expandedKeys.length) {
      trProps.expandedKeys = this._expandedKeys;
    }
    if (this.state.fireOnExpand) {
      trProps.expandedKeys = this.state._expandedKeys;
      trProps.autoExpandParent = false;
    }

    // async loadData
    if (props.loadData) {
      trProps.loadData = props.loadData;
    }

    return _react2['default'].createElement(
      _rcTree2['default'],
      (0, _extends3['default'])({ ref: (0, _util.saveRef)(this, 'popupEle') }, trProps),
      newTreeNodes
    );
  };

  SelectTrigger.prototype.render = function render() {
    var _popupClassName;

    var props = this.props;
    var multiple = props.multiple;
    var dropdownPrefixCls = this.getDropdownPrefixCls();
    var popupClassName = (_popupClassName = {}, _popupClassName[props.dropdownClassName] = !!props.dropdownClassName, _popupClassName[dropdownPrefixCls + '--' + (multiple ? 'multiple' : 'single')] = 1, _popupClassName);
    var visible = props.visible;
    var search = multiple || !props.showSearch ? null : _react2['default'].createElement(
      'span',
      { className: dropdownPrefixCls + '-search' },
      props.inputElement
    );

    var recursive = function recursive(children) {
      // Note: if use `React.Children.map`, the node's key will be modified.
      return (0, _toArray2['default'])(children).map(function handler(child) {
        // eslint-disable-line
        if (!child) {
          return null;
        }
        if (child && child.props.children) {
          // null or String has no Prop
          return _react2['default'].createElement(
            _rcTree.TreeNode,
            (0, _extends3['default'])({}, child.props, { key: child.key }),
            recursive(child.props.children)
          );
        }
        return _react2['default'].createElement(_rcTree.TreeNode, (0, _extends3['default'])({}, child.props, { key: child.key }));
      });
    };
    // const s = Date.now();
    var treeNodes = void 0;
    if (props._cachetreeData && this.treeNodes) {
      treeNodes = this.treeNodes;
    } else {
      treeNodes = recursive(props.treeData || props.treeNodes);
      this.treeNodes = treeNodes;
    }
    // console.log(Date.now()-s);

    if (props.inputValue) {
      treeNodes = this.processTreeNode(treeNodes);
    }

    var keys = [];
    var halfCheckedKeys = [];
    (0, _util.loopAllChildren)(treeNodes, function (child) {
      if (props.value.some(function (item) {
        return item.value === (0, _util.getValuePropValue)(child);
      })) {
        keys.push(child.key);
      }
      if (props.halfCheckedValues && props.halfCheckedValues.some(function (item) {
        return item.value === (0, _util.getValuePropValue)(child);
      })) {
        halfCheckedKeys.push(child.key);
      }
    });

    var notFoundContent = void 0;
    if (!treeNodes.length) {
      if (props.notFoundContent) {
        notFoundContent = _react2['default'].createElement(
          'span',
          { className: props.prefixCls + '-not-found' },
          props.notFoundContent
        );
      } else if (!search) {
        visible = false;
      }
    }
    var popupElement = _react2['default'].createElement(
      'div',
      null,
      search,
      notFoundContent || this.renderTree(keys, halfCheckedKeys, treeNodes, multiple)
    );

    var popupStyle = (0, _extends3['default'])({}, props.dropdownStyle);
    var widthProp = props.dropdownMatchSelectWidth ? 'width' : 'minWidth';
    if (this.state.dropdownWidth) {
      popupStyle[widthProp] = this.state.dropdownWidth + 'px';
    }

    return _react2['default'].createElement(
      _rcTrigger2['default'],
      {
        action: props.disabled ? [] : ['click'],
        ref: (0, _util.saveRef)(this, 'trigger'),
        popupPlacement: 'bottomLeft',
        builtinPlacements: BUILT_IN_PLACEMENTS,
        popupAlign: props.dropdownPopupAlign,
        prefixCls: dropdownPrefixCls,
        popupTransitionName: this.getDropdownTransitionName(),
        onPopupVisibleChange: props.onDropdownVisibleChange,
        popup: popupElement,
        popupVisible: visible,
        getPopupContainer: props.getPopupContainer,
        popupClassName: (0, _classnames2['default'])(popupClassName),
        popupStyle: popupStyle
      },
      this.props.children
    );
  };

  return SelectTrigger;
}(_react.Component);

SelectTrigger.propTypes = {
  dropdownMatchSelectWidth: _propTypes2['default'].bool,
  dropdownPopupAlign: _propTypes2['default'].object,
  visible: _propTypes2['default'].bool,
  filterTreeNode: _propTypes2['default'].any,
  treeNodes: _propTypes2['default'].any,
  inputValue: _propTypes2['default'].string,
  prefixCls: _propTypes2['default'].string,
  popupClassName: _propTypes2['default'].string,
  children: _propTypes2['default'].any
};
exports['default'] = SelectTrigger;
module.exports = exports['default'];
