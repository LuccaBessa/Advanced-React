import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const SINGIN_MUTATION = gql`
    mutation SINGIN_MUTATION($email: String!, $password: String!) {
        signIn(email: $email, password: $password) {
            id
            email
            name
        }
    }
`;

export default class Signin extends Component {
    state = {
        name: '',
        email: '',
        password: '',
    };

    saveToState = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    render() {
        return (
            <Mutation mutation={SINGIN_MUTATION} variables={this.state} refetchQueries={[{ query: CURRENT_USER_QUERY }]}>
                {(signup, { error, loading }) => {
                    return (
                        <Form
                            method='post'
                            onSubmit={async (e) => {
                                e.preventDefault();
                                await signup();
                                this.setState({ name: '', email: '', password: '' });
                            }}
                        >
                            <fieldset disabled={loading} aria-busy={loading}>
                                <Error error={error} />
                                <h2>Sign into your Account</h2>
                                <label htmlFor='email'>
                                    Email
                                    <input type='email' name='email' placeholder='Email' value={this.props.email} onChange={this.saveToState} />
                                </label>
                                <label htmlFor='password'>
                                    Password
                                    <input type='password' name='password' placeholder='Password' value={this.props.password} onChange={this.saveToState} />
                                </label>
                                <button type='submit'>Sign In</button>
                            </fieldset>
                        </Form>
                    );
                }}
            </Mutation>
        );
    }
}
