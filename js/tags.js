(function ($) {
    "use strict"; // Start of use strict

    function isSuperset(set, subset) {
        for (let elem of subset) {
            if (!set.has(elem)) {
                return false
            }
        }
        return true
    }
    
    function renderHighlightedTags(tags_array, chosen_tags_set) {
        let result_array = tags_array.map(tag => chosen_tags_set.has(tag) ? `<b>${tag}</b>` : tag)
        return result_array.join(', ')
    }
    
    function renderClickableTags(tags_set, tag_element, tag_class) {
        tag_element.html('');
        let sorted_tag_array = Array.from(tags_set).sort().map(tag => `<a href="" class="${tag_class}" data-tag="${tag}">${tag}</a>`)
        tag_element.append(sorted_tag_array.join(', '))
    }
    
    function searchUsers(chosen_tags) {
        let search_result = $('#search-result')
        search_result.html('')

        let result_table = $('<table>').attr('id', 'result-table').addClass('table').addClass('table-striped')
        result_table.append('<thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Team</th><th scope="col">Tags</th></tr></thead>')
        let result_table_body = $('<tbody>')

        let all_users = search_result.data('users')
        let users_counter = 0
        for (const [user_email, user_data] of Object.entries(all_users)) {
            let tags = new Set(user_data.tags)
            if (isSuperset(tags, chosen_tags)) {
                users_counter ++
                result_table_body.append(
                    `<tr>
                    <td>${user_data.name}</td>
                    <td>${user_data.email}</td>
                    <td>${user_data.team}</td>
                    <td>${renderHighlightedTags(user_data.tags, chosen_tags)}</td>
                    </tr>`)
            }
        }
        
        if (users_counter > 0) {
            result_table.append(result_table_body)
            search_result.append(result_table)
            result_table.DataTable({
                "order": [[0, "asc"]],
                "columns": [
                    {"name": "Name", "orderable": true},
                    {"name": "Email", "orderable": true},
                    {"name": "Team", "orderable": true},
                    {"name": "Tags", "orderable": false},
                ],
                "iDisplayLength": 50,
                "bLengthChange": false
            });
        } else {
            search_result.append('<p>No ninjas with the specified tags... Try to generalise the query.</p>')
        }

        search_result.show(500)
    }

    const refreshTags = function (tags_to_choose_element, tags_to_choose, chosen_tags_element, chosen_tags) {
        renderClickableTags(tags_to_choose, tags_to_choose_element, 'tag-to-choose')
        renderClickableTags(chosen_tags, chosen_tags_element, 'chosen-tag')

        $('.tag-to-choose').on('click', function (e) {
            e.preventDefault();
            let clicked_tag = $(this).data('tag')
            tags_to_choose.delete(clicked_tag)
            chosen_tags.add(clicked_tag)
            refreshTags(tags_to_choose_element, tags_to_choose, chosen_tags_element, chosen_tags)
        })

        $('.chosen-tag').on('click', function (e) {
            e.preventDefault();
            let clicked_tag = $(this).data('tag')
            chosen_tags.delete(clicked_tag)
            tags_to_choose.add(clicked_tag)
            refreshTags(tags_to_choose_element, tags_to_choose, chosen_tags_element, chosen_tags)
        })
        
        searchUsers(chosen_tags)

    }

    $(document).ready(function () {
        let tags_to_choose_element = $('#tags-to-choose')
        let tags_to_choose = new Set(tags_to_choose_element.data('tags'))
        let chosen_tags_element = $('#chosen-tags')
        let chosen_tags = new Set()

        refreshTags(tags_to_choose_element, tags_to_choose, chosen_tags_element, chosen_tags)

    });

})(jQuery); // End of use strict
