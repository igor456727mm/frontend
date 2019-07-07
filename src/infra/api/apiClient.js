class ApiClient {
  constructor({ transport }) {
    this.transport = transport;
  }

  deleteAccessRequest(key) {
    return this.transport.delete(`/v1/access-requests/${key}`);
  }

  getPersonalManagers() {
    return this.transport.get('/v1/personal-managers')
      .then(res => res.data);
  }
}

export default ApiClient;
