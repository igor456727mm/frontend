import api from '../../common/Api';

class ApiClient {
  constructor({ transport }) {
    this.transport = transport;
  }

  deleteAccessRequest(key) {
    return api.delete(`/v1/access-requests/${key}`)
  }
}

export default ApiClient;
