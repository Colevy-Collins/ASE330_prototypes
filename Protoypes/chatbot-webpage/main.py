import os
import sys
import json
import openai
from openai import OpenAI
import time
from time import sleep

def solve_equation(user_input):
    # Connect to OpenAI API
    openai.api_key='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'
    client = OpenAI(api_key=openai.api_key)

    # Step 1: Create an Assistant
    assistant=client.beta.assistants.create(
        instructions="You are a personal math tutor. Write and run code to answer math questions.", 
        tools=[{"type": "code_interpreter"}], 
        model="gpt-4-1106-preview"
    )

    # Step 2: Create a Thread
    thread = client.beta.threads.create()

    # Step 3: Add a message to the Thread with user input
    message = client.beta.threads.messages.create(
        thread_id=thread.id,role="user",
        content=user_input
    )

    # Step 4: Run the Assistant
    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=assistant.id, 
        instructions="Please address the user as Jane Doe. The user has a premium account."
    )

    # Step 5: Check the Run Status and wait until it is completed
    while True:
        run = client.beta.threads.runs.retrieve(thread_id=thread.id,run_id=run.id)
        print(f"Run status: {run.status}")
        if run.status == 'completed':
            break
        sleep(1)
    # Retrieve the messages and return the assistant's response
    messages = client.beta.threads.messages.list(thread_id=thread.id)
    assist_response = messages.data[0].content[0].text.value #needs to send tread id

    return assist_response


if __name__ == "__main__":
    #user_input = sys.stdin.readline().strip()  # Read input from stdin
    #result = solve_equation(user_input)  # Get the result from the chatbot
    #print(json.dumps({'response': result}))  # Return response in JSON format
    #sys.stdout.flush()  # Ensure immediate output
    input = input("type here")
    print(solve_equation(input))