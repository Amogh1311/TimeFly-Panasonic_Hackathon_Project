import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def calculate_match_score(survey_a, survey_b):
    # 1. Define the exact options for the questions we are comparing
    # This ensures "Business" is always at index 0, "Leisure" at 1, etc.
    q1_options = ['Business / Corporate', 'Leisure / Vacation', 'Visiting Family & Friends', 'Event / Concert / Sports', 'Academic / Research', 'Relocation', 'Tourism / Backpacking', 'Other']
    q3_options = ['Talkative & Social', 'Quiet & Relaxed', 'Gamer / Interactive', 'Collaborator / Networking', 'Movie-Binger', 'Bookworm', 'Sleeper']

    def vectorize(survey):
        # Create a vector of zeros
        vec = np.zeros(len(q1_options) + len(q3_options))
        
        # Mark the chosen option as '1' (One-Hot Encoding)
        # Q1
        q1_val = survey.get('q1')
        if q1_val in q1_options:
            vec[q1_options.index(q1_val)] = 1
            
        # Q3 (Offset by length of q1_options)
        q3_val = survey.get('q3')
        if q3_val in q3_options:
            vec[len(q1_options) + q3_options.index(q3_val)] = 1
            
        return vec

    vec_a = vectorize(survey_a).reshape(1, -1)
    vec_b = vectorize(survey_b).reshape(1, -1)
    
    # Calculate Similarity
    # If the vectors are identical, cosine_similarity returns 1.0 (100%)
    # If they share NO options, it returns 0.0 (0%)
    similarity = cosine_similarity(vec_a, vec_b)[0][0]
    
    # Return 0-100 percentage
    return round(similarity * 100, 1)