import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Error from './ErrorMessage';
import Table from './styles/Table';
import SickButton from './styles/SickButton';
import PropTypes from 'prop-types';

const possiblePermissions = ['ADMIN', 'USER', 'ITEMCREATE', 'ITEMUPDATE', 'ITEMDELETE', 'PERMISSIONUPDATE'];

const UPDATE_PERMISSION_MUTATION = gql`
    mutation updatePermissions($permissions: [Permission], $userId: ID!) {
        updatePermissions(permissions: $permissions, userId: $userId) {
            id
            name
            email
            permissions
        }
    }
`;

const ALL_USERS_QUERY = gql`
    query {
        users {
            id
            name
            email
            permissions
        }
    }
`;

const Permissions = (props) => (
    <Query query={ALL_USERS_QUERY}>
        {({ data, loading, error }) => (
            <div>
                <Error error={error} />
                <div>
                    <h2>Manage Permissions</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                {possiblePermissions.map((per) => (
                                    <th key={per}>{per}</th>
                                ))}
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.users.map((user) => (
                                <UserPermissions key={user.id} user={user} />
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>
        )}
    </Query>
);

class UserPermissions extends React.Component {
    static propTypes = {
        user: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
            email: PropTypes.string,
            permissions: PropTypes.array,
        }).isRequired,
    };

    state = {
        permissions: this.props.user.permissions,
    };

    handlePermissionChange = (e) => {
        const checkbox = e.target;
        let updatedPermissions = this.state.permissions;

        if (checkbox.checked) {
            updatedPermissions.push(checkbox.value);
        } else {
            updatedPermissions = updatedPermissions.filter((per) => per !== checkbox.value);
        }

        this.setState({ permissions: updatedPermissions });
    };

    render() {
        const user = this.props.user;

        return (
            <Mutation mutation={UPDATE_PERMISSION_MUTATION} variables={{ permissions: this.state.permissions, userId: this.props.user.id }}>
                {(updatePermissions, { loading, error }) => (
                    <>
                        {error && (
                            <tr>
                                <td colSpan='8'>
                                    <Error error={error} />
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            {possiblePermissions.map((per) => (
                                <td key={per}>
                                    <label htmlFor={`${user.id}-permission-${per}`}>
                                        <input id={`${user.id}-permission-${per}`} type='checkbox' checked={this.state.permissions.includes(per)} value={per} onChange={this.handlePermissionChange} />
                                    </label>
                                </td>
                            ))}
                            <td>
                                <SickButton type='button' disabled={loading} onClick={updatePermissions}>
                                    Updat{loading ? 'ing' : 'e'}
                                </SickButton>
                            </td>
                        </tr>
                    </>
                )}
            </Mutation>
        );
    }
}

export default Permissions;
