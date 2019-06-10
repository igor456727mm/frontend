import React from 'react'
import {TreeSelect} from 'antd';
import api from '../Api'

const {TreeNode} = TreeSelect;

export const data = {
	currencyId: {
		title: 'ID валюты',
		field: 'currencyId',
		apiUrl: '/v1/currencies',
	}
};


export class Select extends React.Component {
	state = {
		currencyIds: [],
	};
	
	componentDidMount = () => {
		const {currencyIdType} = this.props;
		api.get(data[currencyIdType].apiUrl, {
			params: {
				'per-page': 999
			}
		})
			.then(response => {
				this.setState({currencyIds: response.data})
			})
	};
	
	render() {
		const {currencyIds} = this.state;
		const {multiple} = this.props;
		const renderCurrencyIds = currencyIds
			.map(item => <TreeNode value={String(item.id)} title={item.code} key={item.id}/>);
		return (
			<TreeSelect
				allowClear
				multiple={multiple}
				placeholder="ID валюты не выбран"
				{...this.props}
			>
				{renderCurrencyIds}
			</TreeSelect>
		);
	}
}
