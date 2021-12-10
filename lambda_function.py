import boto3
import botocore
import json
import os


S3 = boto3.client('s3')
BUCKET = 'who-dat-ninja-bucket'


def read_file(path):
    file = open(path, 'r')
    file_in_string = file.read()
    file.close()
    return file_in_string
    


def render_html(html_body, styles=None, scripts=None, content=None):
    if styles:
        for styles_key, styles_value in styles.items():
            html_body = html_body.replace('{{ ' + styles_key + ' }}', f'<style>{styles_value}</style>')
    if scripts:
        for scripts_key, scripts_value in scripts.items():
            html_body = html_body.replace('{{ ' + scripts_key + ' }}', f'<script>{scripts_value}</script>')
    if content:
        for content_key, content_value in content.items():
            html_body = html_body.replace('{{ ' + content_key + ' }}', str(content_value))
    return html_body
    
    
def return_page(styles=None, scripts=None, content=None):
    styles = {} if not styles else styles
    scripts = {} if not scripts else scripts
    content = {} if not content else content
    
    body = read_file('./html/index.html')
    
    styles = {
        'main_css': read_file('./css/main.css'),
    }
    
    scripts = {
        'main_js': read_file('./js/main.js'),
        'tags_js': read_file('./js/tags.js'),
        'edit_js': read_file('./js/edit.js'),
    }
    body = render_html(html_body=body, styles=styles, scripts=scripts, content=content)

    return {
        'statusCode': 200,
        'body': body,
        'headers': {'Content-Type': 'text/html'}
    }
        
        
def get_data_from_s3(key, default):
    try:
        s3_response = S3.get_object(Bucket=BUCKET, Key=key)
        s3_respons_str = s3_response['Body'].read().decode('utf-8')
        result = json.loads(s3_respons_str)
        
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == "NoSuchKey":
            return default
        else:
            raise e
    except Exception as e:
        raise e
        
    return result if result is not None else default
    
    
def update_tags_old(tags_list, new_tags_list):
    tags_list = list(set(tags_list + new_tags_list))
    tags_list.sort()
    with open('/tmp/new_json.json', 'w') as new_json:
        json.dump(tags_list, new_json)
    S3.upload_file('/tmp/new_json.json', BUCKET, 'tags_data/tags.json')
    os.remove('/tmp/new_json.json')
    return tags_list
    
    
def update_tags(users_dict):
    tag_set = set()
    for user_data in users_dict.values():
        tag_set.update(user_data['tags'])
    tags_list = list(tag_set)
    tags_list.sort()
    with open('/tmp/new_json.json', 'w') as new_json:
        json.dump(tags_list, new_json)
    S3.upload_file('/tmp/new_json.json', BUCKET, 'tags_data/tags.json')
    os.remove('/tmp/new_json.json')
    return tags_list
    
    
def update_users(users_dict, user_email, user_name, team, tags):
    users_dict[user_email] = {
        'name': user_name,
        'email': user_email,
        'team': team,
        'tags': tags
    }
    with open('/tmp/new_json.json', 'w') as new_json:
        json.dump(users_dict, new_json)
    S3.upload_file('/tmp/new_json.json', BUCKET, 'users_data/users.json')
    os.remove('/tmp/new_json.json')
    
    tags_list = update_tags(users_dict)
    
    return users_dict, tags_list
        
    
def lambda_handler(event, context):
    try:
        users_dict = get_data_from_s3('users_data/users.json', dict())
        tags_list = get_data_from_s3('tags_data/tags.json', list())
    
        if 'queryStringParameters' in event:
            if event['queryStringParameters'].get('hello') == 'world':
                users_dict, tags_list = update_users(users_dict, 'mkubiak@sttk.com', 'Marek Kubiak', 'CLDSTORE', ['storage', 'cloud', 'assets', 'bonkers'])
            if event['queryStringParameters'].get('foo') == 'bar':
                users_dict, tags_list = update_users(users_dict, 'jleno@sttk.com', 'Jay Leno', 'CLDOPS', ['devops', 'cloud', 'iam', 'bonkers', 'dupers', 'core account'])
            if 'update_users' in event['queryStringParameters']:
                email = event['queryStringParameters'].get('email')
                name = event['queryStringParameters'].get('name')
                team = event['queryStringParameters'].get('team')
                tags = json.loads(event['queryStringParameters'].get('tags'))
                users_dict, tags_list = update_users(users_dict, email, name, team, tags)
                body = {
                    'all_users': users_dict,
                    'all_tags': tags_list
                }
                return {
                    'statusCode': 200,
                    'body': json.dumps(body),
                    'headers': {'Content-Type': 'application/json'}
                }
                
                
        content = {
            'all_users': json.dumps(users_dict),
            'all_tags': json.dumps(tags_list),
            'event': event,
        }
    
        return return_page(content=content)
    except Exception as e:
        return {
                    'statusCode': 500,
                    'body': str(e)
                }
        
    
    
