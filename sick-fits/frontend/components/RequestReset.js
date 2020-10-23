import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const REQUEST_RESET_MUATTION = gql`
    mutation REQUEST_RESET_MUTATION($email: String!) {
        requestReset(email: $email) {
            message
        }
    }
`;

export default class RequestReset extends Component {
    state = {
        email: '',
    };

    saveToState = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    render() {
        return (
            <Mutation mutation={REQUEST_RESET_MUATTION} variables={this.state}>
                {(reset, { error, loading, called }) => {
                    return (
                        <Form
                            method='post'
                            onSubmit={async (e) => {
                                e.preventDefault();
                                await reset();
                                this.setState({ email: '' });
                            }}
                        >
                            <fieldset disabled={loading} aria-busy={loading}>
                                <Error error={error} />
                                {!error && !loading && called && <p>Success! Check your email for a reset link</p>}
                                <h2>Request a password reset</h2>
                                <label htmlFor='email'>
                                    Email
                                    <input type='email' name='email' placeholder='Email' value={this.props.email} onChange={this.saveToState} />
                                </label>
                                <button type='submit'>Request Reset</button>
                            </fieldset>
                        </Form>
                    );
                }}
            </Mutation>
        );
    }
}
