import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const SINGUP_MUATTION = gql`
    mutation SINGUP_MUATTION($email: String!, $name: String!, $password: String!) {
        signUp(email: $email, name: $name, password: $password) {
            id
            email
            name
        }
    }
`;

export default class Signup extends Component {
    state = {
        name: '',
        password: '',
        email: '',
    };

    saveToState = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    render() {
        return (
            <Mutation mutation={SINGUP_MUATTION} variables={this.state} refetchQueries={[{ query: CURRENT_USER_QUERY }]}>
                {(signup, { error, loading }) => {
                    return (
                        <Form
                            method='post'
                            onSubmit={async (e) => {
                                e.preventDefault();
                                await signup();
                                this.setState({ name: '', password: '', email: '' });
                            }}
                        >
                            <fieldset disabled={loading} aria-busy={loading}>
                                <Error error={error} />
                                <h2>Sign Up for an Account</h2>
                                <label htmlFor='email'>
                                    Email
                                    <input type='email' name='email' placeholder='Email' value={this.props.email} onChange={this.saveToState} />
                                </label>
                                <label htmlFor='name'>
                                    Name
                                    <input type='text' name='name' placeholder='Name' value={this.props.name} onChange={this.saveToState} />
                                </label>
                                <label htmlFor='password'>
                                    Password
                                    <input type='password' name='password' placeholder='Password' value={this.props.password} onChange={this.saveToState} />
                                </label>

                                <button type='submit'>Sign Up</button>
                            </fieldset>
                        </Form>
                    );
                }}
            </Mutation>
        );
    }
}
