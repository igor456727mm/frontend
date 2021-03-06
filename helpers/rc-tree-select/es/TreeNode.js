import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import React from 'react';
import PropTypes from 'prop-types';

var TreeNode = function (_React$Component) {
  _inherits(TreeNode, _React$Component);

  function TreeNode() {
    _classCallCheck(this, TreeNode);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  return TreeNode;
}(React.Component);

TreeNode.propTypes = {
  value: PropTypes.string
};
export default TreeNode;