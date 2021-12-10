(function ($) {
    "use strict"; // Start of use strict

    function validateCharacter(c_code) {
        let char = String.fromCharCode(c_code)
        let char_regex = /^[a-zA-Z0-9-_]+$/;
        return char_regex.test(char)
    }

    function emailFieldChange(state) {
        let email_field = $('#email-field')
        state.user_email = email_field.val()
        renderAllFields(state)
    }

    function emailFieldGetExistingUser(state) {
        let email_field = $('#email-field')
        state.user_email = $(email_field).val()
        if (state.all_users_set.has(state.user_email)) {
            let existing_user = state.all_users[state.user_email]
            let existing_user_tags_set = new Set(existing_user.tags)
            let available_tags_set = new Set(
                state.all_tags.filter(x => !existing_user_tags_set.has(x))
            );
            state = {
                ...state,
                available_tags_set: available_tags_set,
                user_email: existing_user.email,
                user_name: existing_user.name,
                user_team: existing_user.team,
                user_tags_set: existing_user_tags_set,
            }
        }
        renderAllFields(state)
    }

    function renderEmailField(state) {
        let email_field = $('#email-field')
        email_field.unbind('keyup')
        email_field.unbind('blur')
        email_field.val(state.user_email)

        email_field.autocomplete(
            {
                source: Object.keys(state.all_users),
                close: () => emailFieldGetExistingUser(state),
            })

        email_field.keyup(function (e) {
            if (e.keyCode == 13) {
                emailFieldGetExistingUser(state)
            } else {
                emailFieldChange(state)
            }
        })

        email_field.blur(function () {
            emailFieldGetExistingUser(state)
        })
    }

    function nameFieldChange(state) {
        let name_field = $('#name-field')
        state.user_name = name_field.val()
        renderAllFields(state)
    }

    function renderNameField(state) {
        let name_field = $('#name-field')
        name_field.val(state.user_name)
        name_field.unbind('keyup')
        name_field.keyup(function () {
            nameFieldChange(state)
        })
    }

    function teamFieldChange(state) {
        let team_field = $('#team-field')
        state.user_team = team_field.val()
        renderAllFields(state)
    }

    function renderTeamField(state) {
        let team_field = $('#team-field')
        team_field.val(state.user_team)
        team_field.unbind('keyup')
        team_field.keyup(function () {
            teamFieldChange(state)
        })
    }

    function tagFieldChange(state) {
        let tag_field = $('#tag-field')
        state.current_tag = tag_field.val()
        renderAllFields(state)
    }

    function tagValidate(tag) {
        let tag_regex = /^[a-zA-Z0-9-_\s]+$/;
        return tag_regex.test(tag)
    }

    function tagButtonClick(state) {
        if (tagValidate(state.current_tag)) {
            state.user_tags_set.add(state.current_tag)
            state.available_tags_set.delete(state.current_tag)
            state.current_tag = ''
            renderAllFields(state)
        } else {
            alert('Tag can only consist of A-Z, a-z, 0-9, -, _')
        }
    }

    function renderTagFieldAndButton(state) {
        let tag_field = $('#tag-field')
        let tag_button = $('#tag-submit')

        tag_field.unbind('keyup')
        tag_field.val(state.current_tag)
        tag_field.autocomplete(
            {
                source: Array.from(state.available_tags_set),
                close: () => tagFieldChange(state),
            })
        tag_field.keyup(function (e) {
            if (e.keyCode == 13) {
                tagButtonClick(state)
            } else {
                tagFieldChange(state)
            }
        })

        if (state.current_tag.length > 0) {
            if (state.user_tags_set.has(state.current_tag)) {
                tag_button.prop('disabled', true)
                tag_button.html('Already Added')
            } else {
                if (state.available_tags_set.has(state.current_tag)) {
                    tag_button.prop('disabled', false)
                    tag_button.html('Add Tag')
                } else {
                    tag_button.prop('disabled', false)
                    tag_button.html('Add New Tag')
                }
            }
        } else {
            tag_button.prop('disabled', true)
            tag_button.html('Add Tag')
        }

        tag_button.unbind('click')
        tag_button.click(function () {
            tagButtonClick(state)
        })
    }

    function renderSelectedTags(state) {
        let user_tags_element = $('#user-tags')
        user_tags_element.html('')
        let sorted_tag_array = Array.from(state.user_tags_set).sort().map(tag => `<a href="" class="user-tags" data-tag="${tag}">${tag}</a>`)
        user_tags_element.append(sorted_tag_array.join(', '))

        $('.user-tags').click(function (e) {
            e.preventDefault();
            let clicked_tag = $(this).data('tag')
            state.user_tags_set.delete(clicked_tag)
            if (state.all_tags_set.has(clicked_tag)) {
                state.available_tags_set.add(clicked_tag)
            }
            renderAllFields(state)
        })
    }

    function submitValidate(state) {
        let validation_message = 'Found validation errors:\n'
        let validation_failed = false
        // email
        let email_regex = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
        if (!email_regex.test(state.user_email)) {
            validation_message += 'Email address is incorrect.\n'
            validation_failed = true
        }

        let safe_regex = /^[a-zA-Z0-9-_\s]+$/;
        // name
        if (!safe_regex.test(state.user_name)) {
            validation_message += 'Name can only consist of A-Z, a-z, 0-9, -, _ and spaces.\n'
            validation_failed = true
        }
        // team
        if (!safe_regex.test(state.user_team)) {
            validation_message += 'Team can only consist of A-Z, a-z, 0-9, -, _ and spaces.\n'
            validation_failed = true
        }
        // tags
        state.user_tags_set.forEach((tag) => {
            if (!safe_regex.test(tag)) {
                validation_message += `Tag '${tag}' can only consist of A-Z, a-z, 0-9, -, _ and spaces.\n`
                validation_failed = true
            }
        })
        
        if (validation_failed) {
            alert(validation_message)
        }
        
        return !validation_failed
    }

    function submitButtonClick(state) {
        if (submitValidate(state)) {
            let jsonified_tags = JSON.stringify(Array.from(state.user_tags_set))
            let url = `/default/who-dat-ninja?update_users&email=${state.user_email}&name=${state.user_name}&team=${state.user_team}&tags=${jsonified_tags}`
            $.ajax({
                type: "GET",
                url: url,
                context: state,
                success: function (res) {
                    alert('Ninja updated!')
                    let available_tags_set = new Set(
                        res.all_tags.filter(x => !state.user_tags_set.has(x))
                    );
                    state = {
                        ...state,
                        all_users: res.all_users,
                        all_users_set: new Set(Object.keys(res.all_users)),
                        all_tags: res.all_tags,
                        all_tags_set: new Set(res.all_tags),
                        available_tags_set: available_tags_set,
                    }
                    renderAllFields(state)
                },
                error: function (res) {
                    alert(`Oops, something went wrong, status code: ${res.status}`)
                }
            });
        }
    }

    function renderSubmitButton(state) {
        let submit_button = $('#user-submit')

        let email_regex = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
        if (email_regex.test(state.user_email)) {
            submit_button.prop('disabled', false)
            if (state.all_users_set.has(state.user_email)) {
                submit_button.html('Edit Ninja')
            } else {
                submit_button.html('Add Ninja')
            }
        } else {
            submit_button.prop('disabled', true)
            submit_button.html('Add / Edit Ninja')
        }

        submit_button.unbind('click')
        submit_button.click(function () {
            submitButtonClick(state)
            renderAllFields(state)
        })
    }

    function renderAllFields(state) {
        renderEmailField(state)
        renderNameField(state)
        renderTeamField(state)
        renderTagFieldAndButton(state)
        renderSelectedTags(state)
        renderSubmitButton(state)
    }

    $(document).ready(function () {
        let email_field = $('#email-field')
        let name_field = $('#name-field')
        let team_field = $('#team-field')
        let tag_field = $('#tag-field')
        let user_tags_element = $('#user-tags')
        let tag_button = $('#tag-submit')
        let user_button = $('#user-submit')

        let all_users = $('#all-data').data('users')
        let all_tags = $('#all-data').data('tags')
        let state = {
            all_users: all_users,
            all_users_set: new Set(Object.keys(all_users)),
            all_tags: all_tags,
            all_tags_set: new Set(all_tags),
            available_tags_set: new Set(all_tags),
            user_email: '',
            user_name: '',
            user_team: '',
            current_tag: '',
            user_tags_set: new Set(),
        }

        renderAllFields(state)

    });

})(jQuery); // End of use strict
