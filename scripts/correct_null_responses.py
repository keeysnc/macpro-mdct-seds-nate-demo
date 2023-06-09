import boto3
import time

# This script was created to address null values in the seds reports, and set them as 0 for accessibility reasons.
# Items should display as 0 for screen readers, and not have a heap of empty cells
# This script will modify every entry in the row column with "rows.col*" entries from {"NULL": True} -> {"N": "0"}
#
# Running this script:
#    * Set the aws environment config file with the temporary values in [default] within ~/.aws/config
#    * pip install boto3
#    * Set RUN_LOCAL, RUN_UPDATE, and STAGE appropriately
#    * run the script (`python3 correct_null_responses.py`)

RUN_LOCAL = True                        # Target localhost:8000
RUN_UPDATE = False                       # Dispatch updates for detected changes
STAGE = "master"                        # Prefix for the environment
TABLE = "-form-answers"
BAD_VALUE = None  # {"NULL": True}
GOOD_VALUE = 0  # {"N": "0"}


def main():
    # Config db connection
    dynamodb = None
    stage = STAGE
    if RUN_LOCAL:
        dynamodb = boto3.resource(
            'dynamodb', endpoint_url='http://localhost:8000')
        stage = "local"
    else:
        dynamodb = boto3.resource('dynamodb')
    print("Updating ", stage + TABLE)
    table = dynamodb.Table(stage + TABLE)

    # Perform scan and execute a new batch for each 'LastEvaluatedKey'
    response = table.scan()
    updates = process_response(response)
    total_scans = 1
    while 'LastEvaluatedKey' in response:
        total_scans += 1
        print("Batch", total_scans)
        print("  -- LastEvaluatedKey:", response['LastEvaluatedKey'])

        # BATCH
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        modified = process_response(response)
        updates.extend(modified)

        # Log details
        print("  -- Changed Count:", len(modified),
              "/", len(response['Items']))

    # Execute Changes
    if RUN_UPDATE:
        update(table, updates)


def process_response(response):
    items = response['Items']
    corrections = [correct_responses(i) for i in items]
    changed = [updated_item for (
        updated_item, modified) in corrections if modified == True]

    return changed


def correct_responses(item):
    changes = False
    for row in item["rows"]:
        for key in [k for k in row]:
            if type(key) == str and key.startswith('col') and row[key] == BAD_VALUE:
                row[key] = GOOD_VALUE
                changes = True
    return item, changes


def update(table, changed):
    print("Preparing Batch")
    with table.batch_writer() as writer:
        for item in changed:
            writer.put_item(Item=item)
    print("Batch executed")


#### RUN #####
if __name__ == "__main__":
    start_time = time.time()
    main()
    print("--- %s seconds ---" % (time.time() - start_time))
