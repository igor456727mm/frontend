import _extends from 'babel-runtime/helpers/extends';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import Trigger from 'rc-trigger';
import Tree, { TreeNode } from 'rc-tree';
import { loopAllChildren, flatToHierarchy, getValuePropValue, labelCompatible, saveRef } from './util';
import toArray from 'rc-util/es/Children/toArray';

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
  _inherits(SelectTrigger, _Component);

  function SelectTrigger() {
    var _temp, _this, _ret;

    _classCallCheck(this, SelectTrigger);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.state = {
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
      var filterVal = treeNode.props[labelCompatible(props.treeNodeFilterProp)];
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
    }, _temp), _possibleConstructorReturn(_this, _ret);
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
    var width = ReactDOM.findDOMNode(this).offsetWidth;
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
    loopAllChildren(treeNodes, function (child, index, pos) {
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
    loopAllChildren(treeNodes, function (child, index, pos) {
      if (processedPoss.indexOf(pos) > -1) {
        filterNodesPositions.push({ node: child, pos: pos });
      }
    });

    var hierarchyNodes = flatToHierarchy(filterNodesPositions);

    var recursive = function recursive(children) {
      return children.map(function (child) {
        if (child.children) {
          return React.cloneElement(child.node, {}, recursive(child.children));
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

    return React.createElement(
      Tree,
      _extends({ ref: saveRef(this, 'popupEle') }, trProps),
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
    /* var search = multiple || !props.showSearch ? null : React.createElement(
      'span',
      { className: dropdownPrefixCls + '-search' },
      props.inputElement
    ); */


    var search = React.createElement(
      'span',
      { className: dropdownPrefixCls + '-search' },
      props.inputElement
    );

    var recursive = function recursive(children) {
      // Note: if use `React.Children.map`, the node's key will be modified.
      return toArray(children).map(function handler(child) {
        // eslint-disable-line
        if (!child) {
          return null;
        }
        if (child && child.props.children) {
          // null or String has no Prop
          return React.createElement(
            TreeNode,
            _extends({}, child.props, { key: child.key }),
            recursive(child.props.children)
          );
        }
        return React.createElement(TreeNode, _extends({}, child.props, { key: child.key }));
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
    loopAllChildren(treeNodes, function (child) {
      if (props.value.some(function (item) {
        return item.value === getValuePropValue(child);
      })) {
        keys.push(child.key);
      }
      if (props.halfCheckedValues && props.halfCheckedValues.some(function (item) {
        return item.value === getValuePropValue(child);
      })) {
        halfCheckedKeys.push(child.key);
      }
    });

    var notFoundContent = void 0;
    if (!treeNodes.length) {
      if (props.notFoundContent) {
        notFoundContent = React.createElement(
          'span',
          { className: props.prefixCls + '-not-found' },
          props.notFoundContent
        );
      } else if (!search) {
        visible = false;
      }
    }
    var popupElement = React.createElement(
      'div',
      null,
      search,
      notFoundContent || this.renderTree(keys, halfCheckedKeys, treeNodes, multiple)
    );

    var popupStyle = _extends({}, props.dropdownStyle);
    var widthProp = props.dropdownMatchSelectWidth ? 'width' : 'minWidth';
    if (this.state.dropdownWidth) {
      popupStyle[widthProp] = this.state.dropdownWidth + 'px';
    }

    return React.createElement(
      Trigger,
      {
        action: props.disabled ? [] : ['click'],
        ref: saveRef(this, 'trigger'),
        popupPlacement: 'bottomLeft',
        builtinPlacements: BUILT_IN_PLACEMENTS,
        popupAlign: props.dropdownPopupAlign,
        prefixCls: dropdownPrefixCls,
        popupTransitionName: this.getDropdownTransitionName(),
        onPopupVisibleChange: props.onDropdownVisibleChange,
        popup: popupElement,
        popupVisible: visible,
        getPopupContainer: props.getPopupContainer,
        popupClassName: classnames(popupClassName),
        popupStyle: popupStyle
      },
      this.props.children
    );
  };

  return SelectTrigger;
}(Component);

SelectTrigger.propTypes = {
  dropdownMatchSelectWidth: PropTypes.bool,
  dropdownPopupAlign: PropTypes.object,
  visible: PropTypes.bool,
  filterTreeNode: PropTypes.any,
  treeNodes: PropTypes.any,
  inputValue: PropTypes.string,
  prefixCls: PropTypes.string,
  popupClassName: PropTypes.string,
  children: PropTypes.any
};


export default SelectTrigger;
